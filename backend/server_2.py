from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import os
import zipfile
import xml.etree.ElementTree as ET
from flask import send_from_directory
import sys
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCORM_DIR = os.path.join(BASE_DIR, "scorm_files")
os.chdir(BASE_DIR)
#hihi

app = Flask(__name__)
@app.errorhandler(Exception)
def handle_exception(e):
    return jsonify({"error": str(e), "type": type(e).__name__}), 500

CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS",'PATCH'],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
port = int(os.environ.get("PORT", 8080))


import random
import string

def generate_temp_password(length=10):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choices(chars, k=length))



# Database connection
def get_db():
    db_url = os.environ.get("DATABASE_URL")
    if db_url:
        return psycopg2.connect(db_url)
        
    conn = psycopg2.connect(
        host="localhost",
        database="lms_db",
        user="postgres",
        password="1234",
        port="5432"
    )
    return conn
#──────────────────────────────────────────────────REGISTER API─────────────────────────────────────────────────────
@app.route("/register", methods=["POST"])
def register():
    data = request.json

    first = data.get("firstName")
    last = data.get("lastName")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role")
    instructor_id = data.get("instructor_id")

    conn = get_db()
    cur = conn.cursor()

    try:
        if not all([first, last, email, password, role]):
            return jsonify({"error": "All fields are required"}), 400
        
        elif role =='instructor':
            cur.execute("SELECT used FROM instructor_dt WHERE temp_id=%s",(instructor_id,))
            result = cur.fetchone()
            if not result:
                return jsonify({"error": "Invalid Instructor Id"}),403
            if result[0] == True:
                return jsonify({"error": "Instructor ID already used"}), 403
            if result[0]== False:
                cur.execute("INSERT INTO users (firstname, lastname, email, password,role) VALUES (%s,%s,%s,%s,%s)",
                         ( first, last, email, password, role))
                conn.commit()
                cur.execute("UPDATE instructor_dt SET used=TRUE WHERE instructor_dt.temp_id=%s",(instructor_id,))
                cur.execute("UPDATE instructor_dt SET user_id=users.id from users  WHERE users.email=%s ",(email,))
                cur.execute("UPDATE instructor_dt SET created_at = NOW() WHERE temp_id = %s;",(instructor_id))
                conn.commit()
                
             #storing user info data into database    
        elif role=='student':
            cur.execute(
                "INSERT INTO users (firstname, lastname, email, password, role) VALUES (%s,%s,%s,%s,%s)",
                (first, last, email, password, role)
            )
            conn.commit()

        return jsonify({"message": "User registered successfully"})

    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        return jsonify({"error": "Email already exists"}), 400

    finally:
        cur.close()
        conn.close()

# ──────────────────────────────────────────────────LOGIN API─────────────────────────────────────────────────────
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        "SELECT role,id FROM users WHERE email=%s AND password=%s",
        (email, password)
    )
    user = cur.fetchone()
    cur.close()
    conn.close()

    if user:
        role=user[0]
        user_id=user[1]
        return jsonify({
            "message":"Login Successful",
            "user_id":user_id,
            "role": role               
        })
    
   
    else:
        return jsonify({"error": "Invalid credentials"}), 401

#─────────────────────────────────update last active by getting user_id when user clicks and on login─────────────────────────────────────────────────────
@app.route("/api/users/<int:user_id>/last-active", methods=["PATCH","OPTIONS"])
def update_last_active(user_id):
    print("Updating last active for:", user_id)
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE users SET last_active = NOW() WHERE id = %s", (user_id,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"success": True, "message": "Activity updated"})

# ───────────────────────────────────────STATS API - for admin dashboard cards─────────────────────────────────────────────────────
@app.route("/api/stats", methods=["GET"])
def get_stats():
    conn = get_db()
    cur = conn.cursor()

    try:
        # Total students + active (active = last_active within 7 days)
        cur.execute("""
            SELECT 
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE last_active > NOW() - INTERVAL '7 days') AS active
            FROM users 
            WHERE role = 'student'
        """)
        students = cur.fetchone()

        # Total courses + published
        cur.execute("""
            SELECT 
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status = 'published') AS published
            FROM courses
        """)
        courses = cur.fetchone()

        # Total instructors + pending (used = FALSE means not yet approved)
        cur.execute("""
            SELECT 
                COUNT(DISTINCT u.id) AS total,
                COUNT(*) FILTER (WHERE idt.used = FALSE) AS pending
            FROM users u
            LEFT JOIN instructor_dt idt ON idt.user_id = u.id
            WHERE u.role = 'instructor'
        """)
        instructors = cur.fetchone()

        return jsonify({
            "students": {
                "total":  students[0],
                "active": students[1]
            },
            "courses": {
                "total":     courses[0],
                "published": courses[1]
            },
            "instructors": {
                "total":   instructors[0],
                "pending": instructors[1]
            }
        })

    except Exception as  e:
        return jsonify({"error": str(e)}), 500

    finally:
        cur.close()
        conn.close()

# ──────────────────────────────────────────────Get the course data─────────────────────────────────────────────────────
@app.route("/courses", methods=["GET"])
def get_courses():
    conn = get_db()
    cur = conn.cursor()
    try:
        # cur.execute("""
        #     SELECT c.course_id, c.title, c.category, c.status,
        #            u.firstname || ' ' || u.lastname AS instructor
        #     FROM courses c
        #     LEFT JOIN users u ON u.id = c.instructor_id
        #     ORDER BY c.course_id
        # """)
        cur.execute("""
                SELECT c.course_id, c.title, c.category, c.status,
                    u.firstname || ' ' || u.lastname AS instructor,
                    c.course_type
                FROM courses c
                LEFT JOIN users u ON u.id = c.instructor_id
                ORDER BY c.course_id
            """)
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        return jsonify(rows)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()
#───────────────────────────────────────────────────ADD course─────────────────────────────────────────────────────
@app.route("/add-course", methods=["POST"])
def add_course():
    conn = get_db()
    cur = conn.cursor()
    try:
        data = request.json
        if not data or not data.get("title"):
            return jsonify({"error": "Title is required"}), 400
        instructor_id = data.get("instructor_id")
        instructor_id = int(instructor_id) if instructor_id else None
        
        cur.execute("""
            INSERT INTO courses (title, description, instructor_id, category, status)
            VALUES (%s, %s, %s, %s,%s)
            RETURNING course_id
        """, (
            data.get("title"),
            data.get("description"),
            instructor_id,   # from the form
            data.get("category", "Programming"),
            data.get("status", "draft")
        ))
        new_id = cur.fetchone()[0]
        conn.commit()
        return jsonify({"id": new_id})

    except Exception as e:
        print("ADD COURSE ERROR:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

#──────────────────────────────────────────────────UPDATE course─────────────────────────────────────────────────────
@app.route("/update-course/<int:course_id>", methods=["PUT"])
def update_course(course_id):
    conn = get_db()
    cur = conn.cursor()
    try:
        data = request.json
        instructor_id = data.get("instructor_id")
        instructor_id = int(instructor_id) if instructor_id else None
        cur.execute("""
            UPDATE courses 
            SET title=%s, description=%s, instructor_id=%s, category=%s, status=%s
            WHERE course_id=%s
        """, (
            data.get("title"),
            data.get("description"),
            instructor_id,
            data.get("category"),
            data.get("status"),
            course_id
        ))
        conn.commit()
        return jsonify({"success": True})

    except Exception as e:
        print("ADD COURSE ERROR:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

#──────────────────────────────────────────────────DELETE course─────────────────────────────────────────────────────
@app.route("/delete-course/<int:course_id>", methods=["DELETE"])
def delete_course(course_id):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM courses WHERE course_id=%s", (course_id,))
        conn.commit()
        return jsonify({"success": True})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

#─────────────────────────────────────────────────────MODULES────────────────────────────────────────────────────────────────
@app.route("/api/courses/<int:course_id>/modules", methods=["GET","POST"])
def course_modules(course_id):
    conn = get_db()
    cur = conn.cursor()
    if request.method == "GET":
        # Called by useEffect on CourseManager load
        cur.execute("SELECT module_id, title, description FROM modules WHERE course_id = %s ORDER BY module_id", (course_id,))
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        cur.close(); conn.close()
        return jsonify(rows)

    if request.method == "POST":
        # Called by saveModule() when adding
        data = request.json
        if not data or not data.get("title") :
            return jsonify({"error": "Title is required"}), 400
        
        cur.execute("INSERT INTO modules (course_id, title, description) VALUES (%s,%s,%s) RETURNING module_id",
                    (course_id, data.get("title"), data.get("description","")))
        new_id = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        return jsonify({"id": new_id})
#─────────────────────────────────────────────────────MODULES─────────────────────────────────────────────────────
@app.route("/api/modules/<int:module_id>", methods=["PUT", "DELETE"])
def module_detail(module_id):
    conn = get_db(); cur = conn.cursor()

    if request.method == "PUT":
        # Called by saveModule() when editing
        data = request.json
        cur.execute("UPDATE modules SET title=%s, description=%s WHERE module_id=%s",
                    (data.get("title"), data.get("description",""), module_id))
        conn.commit(); cur.close(); conn.close()
        return jsonify({"success": True})

    if request.method == "DELETE":
        # Called by delModule()
        cur.execute("DELETE FROM modules WHERE module_id=%s", (module_id,))
        conn.commit(); cur.close(); conn.close()
        return jsonify({"success": True})

#─────────────────────────────────────────────────────LESSONS────────────────────────────────────────────────────────────────
@app.route("/api/modules/<int:module_id>/lessons", methods=["GET", "POST"])
def module_lessons(module_id):
    conn = get_db(); cur = conn.cursor()

    if request.method == "GET":
        # Called by loadLessons() when module is expanded
        # cur.execute("SELECT lesson_id, title, content_type FROM lessons WHERE module_id = %s ORDER BY lesson_id", (module_id,))
        cur.execute("""SELECT lesson_id, title, content_type, scorm_id FROM lessons
                    WHERE module_id = %s ORDER BY lesson_id""", (module_id,))
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        cur.close(); conn.close()
        return jsonify(rows)

    # Called by saveModule() when mode = add.
    if request.method == "POST":
        data = request.json
        cur.execute("INSERT INTO lessons (module_id, title, content_type) VALUES (%s,%s,%s) RETURNING lesson_id",
                    (module_id, data["title"], data.get("content_type","text")))
           #cur.execute("INSERT INTO LESSONS (module_id,) ")
        new_id = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        return jsonify({"id": new_id})

#─────────────────────────────────────────────────────LESSONS─────────────────────────────────────────────────────
@app.route("/api/lessons/<int:lesson_id>", methods=["PUT", "DELETE"])
def lesson_detail(lesson_id):
    conn = get_db(); cur = conn.cursor()

    if request.method == "PUT":
        data = request.json
        cur.execute("UPDATE lessons SET title=%s, content_type=%s WHERE lesson_id=%s",
                    (data["title"], data.get("content_type","text"), lesson_id))
        conn.commit(); cur.close(); conn.close()
        return jsonify({"success": True})

    if request.method == "DELETE":
        cur.execute("DELETE FROM lessons WHERE lesson_id=%s", (lesson_id,))
        conn.commit(); cur.close(); conn.close()
        return jsonify({"success": True})    

#────────────────────────────────────────────────Get & add MATERIALS ──────────────────────────────────────────────────────────────
@app.route("/api/lessons/<int:lesson_id>/materials", methods=["GET", "POST"])
def lesson_materials(lesson_id):
    conn = get_db(); cur = conn.cursor()

    if request.method == "GET":
        # Called by loadMaterials() when lesson is expanded
        cur.execute("SELECT lesson_id, title, type, url FROM materials WHERE lesson_id = %s ORDER BY material_id", (lesson_id,))
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        cur.close(); conn.close()
        return jsonify(rows)

    if request.method == "POST":
        data = request.json
        cur.execute("INSERT INTO materials (lesson_id, title, type, url) VALUES (%s,%s,%s,%s) RETURNING material_id",
                    (lesson_id, data["title"], data.get("type","pdf"), data.get("url","")))
        new_id = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        return jsonify({"id": new_id})

#───────────────────────────────────────────────────Delete Material─────────────────────────────────────────────────────
@app.route("/api/materials/<int:material_id>", methods=["DELETE"])
def material_detail(material_id):
    conn = get_db(); cur = conn.cursor()
    cur.execute("DELETE FROM materials WHERE mat_id=%s", (material_id,))
    conn.commit(); cur.close(); conn.close()
    return jsonify({"success": True})

#──────────────────────────────────────────────Get instructors information─────────────────────────────────────────────────────
@app.route("/api/instructors-overview", methods=["GET"])
def instructors_overview():
    conn = get_db()
    cur = conn.cursor()

    try:
        # Get all instructors
        cur.execute("""
            SELECT id, firstname, lastname, email
            FROM users
            WHERE role = 'instructor'
            ORDER BY firstname
        """)
        instructor_cols = [d[0] for d in cur.description]
        instructors = [dict(zip(instructor_cols, row)) for row in cur.fetchall()]

        # For each instructor, get their courses using instructor__id
        for inst in instructors:
            cur.execute("""
                SELECT course_id, title, status
                FROM courses
                WHERE instructor_id = %s
                ORDER BY title
            """, (inst["id"],))
            course_cols = [d[0] for d in cur.description]
            inst["courses"] = [dict(zip(course_cols, row)) for row in cur.fetchall()]

        return jsonify(instructors)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cur.close()
        conn.close()

#─────────────────────────────────────────────────────GET ALL USERS─────────────────────────────────────────────────────
@app.route("/api/users", methods=["GET"])
def get_users():
    conn = get_db(); cur = conn.cursor()
    cur.execute("SELECT id, firstname, lastname, email, role, is_active, last_active FROM users")
    rows = cur.fetchall()
    cur.close(); conn.close()

    users = []
    for r in rows:
        users.append({
            "id": r[0],
            "firstname": r[1],
            "lastname": r[2],
            "email": r[3],
            "role": r[4],
            "status": "active" if r[5] else "suspended",  # ← convert bool to string
            "last_active": r[6]
        })
    return jsonify(users)

#─────────────────────────────────────────────────────ADD USER─────────────────────────────────────────────────────
@app.route("/api/users", methods=["POST"])
def add_user():
    data = request.json
    conn = get_db(); cur = conn.cursor()
    try:
        temp_password = generate_temp_password()  # ← auto generate
        cur.execute(
            "INSERT INTO users (firstname, lastname, email, password, role) VALUES (%s,%s,%s,%s,%s) RETURNING id",
            (data.get("firstname"), data.get("lastname"), data.get("email"), temp_password, data.get("role"))
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        return jsonify({
            "id": new_id,
            "temp_password": temp_password,   # ← send it back to frontend
            "message": "User added successfully"
        })
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        return jsonify({"error": "Email already exists"}), 400
    finally:
        cur.close(); conn.close()

#─────────────────────────────────────────────────────UPDATE USER─────────────────────────────────────────────────────
@app.route("/api/users/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    data = request.json
    conn = get_db(); cur = conn.cursor()
    
    status_bool = True if data.get("status") == "active" else False
    try:
        cur.execute(
            "UPDATE users SET firstname=%s, lastname=%s, email=%s, role=%s, is_active=%s WHERE id=%s",
            (data.get("firstname"), data.get("lastname"), data.get("email"), data.get("role"), status_bool, user_id)
        )
        conn.commit()
        return jsonify({"message": "User updated successfully"})
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        return jsonify({"error": "Email already exists"}), 400
    finally:
        cur.close(); conn.close()
        
#────────────────────────────────────────────────────DELETE USER─────────────────────────────────────────────────────
@app.route("/api/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    conn = get_db(); cur = conn.cursor()
    try:
        cur.execute("DELETE FROM users WHERE id=%s", (user_id,))
        conn.commit()
        cur.close(); conn.close()
        return jsonify({"message": "User deleted successfully"})
    except psycopg2.errors.ForeignKeyViolation:
        conn.rollback()
        cur.close(); conn.close()
        return jsonify({"message": "Failed to delete Instructor as still enrolled in course"}), 400
    except Exception as e:
        conn.rollback()
        cur.close(); conn.close()
        return jsonify({"message": str(e)}), 500
    
#───────────────────────────────────────────────────SCORM ROUTES─────────────────────────────────────────────────────
@app.route("/api/courses/<int:course_id>/upload-scorm", methods=["POST"])
def upload_scorm(course_id):
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if not file.filename.endswith(".zip"):
        return jsonify({"error": "Only .zip files are allowed"}), 400

    # Extract zip to /scorm_files/<course_id>/
    #extract_path = os.path.join("scorm_files", str(course_id))
    extract_path = os.path.abspath(os.path.join(SCORM_DIR, str(course_id))).replace("\\", "/")
    os.makedirs(extract_path, exist_ok=True)

    zip_path = os.path.join(extract_path, "package.zip")
    file.save(zip_path)

    with zipfile.ZipFile(zip_path, "r") as z:
        z.extractall(extract_path)
    os.remove(zip_path)

    # Parse imsmanifest.xml
    manifest_path = os.path.join(extract_path, "imsmanifest.xml")
    if not os.path.exists(manifest_path):
        return jsonify({"error": "imsmanifest.xml not found in zip"}), 400

    try:
        tree = ET.parse(manifest_path)
        root = tree.getroot()

        # Strip namespace for easier parsing
        ns = root.tag.split("}")[0].strip("{") if "}" in root.tag else ""
        def tag(name): return f"{{{ns}}}{name}" if ns else name

        # Detect SCORM version
        version = "scorm_1.2"
        for meta in root.iter(tag("schemaversion")):
            if "2004" in (meta.text or ""):
                version = "scorm_2004"
            break

        # Find entry point (first SCO resource href)
        entry_point = None
        for resource in root.iter(tag("resource")):
            attrs = {k.split("}")[-1]: v for k, v in resource.attrib.items()}
            scorm_type = attrs.get("scormtype") or attrs.get("adlcp:scormtype", "")
            if "sco" in scorm_type.lower():
                entry_point = attrs.get("href")
                break

        # Fallback: first resource with href
        if not entry_point:
            for resource in root.iter(tag("resource")):
                href = resource.attrib.get("href")
                if href:
                    entry_point = href
                    break

        if not entry_point:
            return jsonify({"error": "Could not find entry point in manifest"}), 400

    except Exception as e:
        return jsonify({"error": f"Failed to parse manifest: {str(e)}"}), 500

    # Save to DB
    conn = get_db()
    cur = conn.cursor()
    try:
        # Update course_type
        cur.execute("UPDATE courses SET course_type = 'scorm' WHERE course_id = %s", (course_id,))
         # Upsert scorm_packages
        cur.execute("""
            INSERT INTO scorm_packages (course_id, file_path, entry_point, version)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (course_id) WHERE lesson_id IS NULL DO UPDATE
            SET file_path = EXCLUDED.file_path,
                entry_point = EXCLUDED.entry_point,
                version = EXCLUDED.version,
                uploaded_at = CURRENT_TIMESTAMP
        """, (course_id, extract_path, entry_point, version))

        conn.commit()
        return jsonify({
            "success": True,
            "entry_point": entry_point,
            "version": version
        })
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()
        
#Get SCORM launch info route
@app.route("/api/courses/<int:course_id>/scorm-launch", methods=["GET"])
def scorm_launch(course_id):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT file_path, entry_point, version 
            FROM scorm_packages 
            WHERE course_id = %s
        """, (course_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"error": "No SCORM package found for this course"}), 404
        return jsonify({
            "base_url": f"/scorm_files/{course_id}/",
            "entry_point": row[1],
            "version": row[2]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

#Scorm-Progress save/load route
@app.route("/api/scorm/<int:course_id>/progress", methods=["GET", "POST"])
def scorm_progress(course_id):
    conn = get_db()
    cur = conn.cursor()

    # ───────────────────────── GET ─────────────────────────
    if request.method == "GET":
        user_id = request.args.get("user_id")
        attempt_id = request.args.get("attempt_id")

        if not user_id:
            return jsonify({"error": "user_id is required"}), 400

        try:
            #  If attempt_id provided → fetch specific attempt
            if attempt_id:
                cur.execute("""
                    SELECT completion_status, score, suspend_data, lesson_location
                    FROM scorm_attempts
                    WHERE attempt_id = %s
                """, (attempt_id,))
            else:
                # fallback → use progress table (no lesson_location column)
                lesson_id = request.args.get("lesson_id")
                if lesson_id:
                    cur.execute("""
                        SELECT completion_status, score, suspend_data
                        FROM scorm_progress
                        WHERE course_id = %s AND user_id = %s AND lesson_id = %s
                    """, (course_id, user_id, lesson_id))
                else:
                    cur.execute("""
                        SELECT completion_status, score, suspend_data
                        FROM scorm_progress
                        WHERE course_id = %s AND user_id = %s AND lesson_id IS NULL
                    """, (course_id, user_id))

            row = cur.fetchone()

            if not row:
                return jsonify({
                    "completion_status": "incomplete",
                    "score": 0,
                    "suspend_data": "",
                    "lesson_location": ""
                })

            # attempt query returns 4 cols, progress query returns 3
            if attempt_id:
                return jsonify({
                    "completion_status": row[0],
                    "score": row[1],
                    "suspend_data": row[2] or "",
                    "lesson_location": row[3] or ""
                })
            else:
                return jsonify({
                    "completion_status": row[0],
                    "score": row[1],
                    "suspend_data": row[2] or "",
                    "lesson_location": ""
                })

        except Exception as e:
            return jsonify({"error": str(e)}), 500

        finally:
            cur.close()
            conn.close()

    # ───────────────────────── POST ─────────────────────────
    if request.method == "POST":
        data = request.json
        user_id = data.get("user_id")
        attempt_id = data.get("attempt_id")

        if not user_id:
            return jsonify({"error": "user_id is required"}), 400

        try:
            # STEP 1: Update attempt (NEW)
            if attempt_id:
                cur.execute("""
                    UPDATE scorm_attempts
                    SET 
                        completion_status = %s,
                        score = %s,
                        suspend_data = %s,
                        lesson_location = %s,
                        last_accessed = NOW(),
                        completed_at = CASE 
                            WHEN %s IN ('completed','passed','failed') THEN NOW()
                            ELSE completed_at
                        END
                    WHERE attempt_id = %s
                """, (
                    data.get("completion_status", "incomplete"),
                    data.get("score", 0),
                    data.get("suspend_data", ""),
                    data.get("lesson_location", ""),
                    data.get("completion_status", "incomplete"),
                    attempt_id
                ))

            # STEP 2: Get best score (for grading)
            cur.execute("""
                SELECT MAX(score)
                FROM scorm_attempts
                WHERE user_id = %s AND course_id = %s
            """, (user_id, course_id))

            best_score = cur.fetchone()[0] or 0

            # STEP 3: Upsert main progress (with lesson_id awareness)
            lesson_id = data.get("lesson_id")  # None for course-level SCORM

            # Manual upsert: check existence first (handles NULL lesson_id correctly)
            if lesson_id:
                cur.execute("""
                    SELECT id FROM scorm_progress
                    WHERE user_id = %s AND course_id = %s AND lesson_id = %s
                """, (user_id, course_id, lesson_id))
            else:
                cur.execute("""
                    SELECT id FROM scorm_progress
                    WHERE user_id = %s AND course_id = %s AND lesson_id IS NULL
                """, (user_id, course_id))

            existing = cur.fetchone()

            if existing:
                if lesson_id:
                    cur.execute("""
                        UPDATE scorm_progress
                        SET completion_status = %s, score = %s, suspend_data = %s,
                            last_accessed = NOW()
                        WHERE user_id = %s AND course_id = %s AND lesson_id = %s
                    """, (
                        data.get("completion_status", "incomplete"),
                        best_score,
                        data.get("suspend_data", ""),
                        user_id, course_id, lesson_id
                    ))
                else:
                    cur.execute("""
                        UPDATE scorm_progress
                        SET completion_status = %s, score = %s, suspend_data = %s,
                            last_accessed = NOW()
                        WHERE user_id = %s AND course_id = %s AND lesson_id IS NULL
                    """, (
                        data.get("completion_status", "incomplete"),
                        best_score,
                        data.get("suspend_data", ""),
                        user_id, course_id
                    ))
            else:
                cur.execute("""
                    INSERT INTO scorm_progress
                        (user_id, course_id, lesson_id, completion_status, score,
                         suspend_data, last_accessed)
                    VALUES (%s, %s, %s, %s, %s, %s, NOW())
                """, (
                    user_id, course_id, lesson_id,
                    data.get("completion_status", "incomplete"),
                    best_score,
                    data.get("suspend_data", "")
                ))

            conn.commit()
            return jsonify({"success": True})

        except Exception as e:
            conn.rollback()
            return jsonify({"error": str(e)}), 500

        finally:
            cur.close()
            conn.close()
#Serve extracted SCORM files statically
@app.route("/scorm_files/<path:filename>")
def serve_scorm(filename):
    base = os.path.abspath(SCORM_DIR)
    print(f"DEBUG: Looking for {os.path.join(base, filename)}")
    return send_from_directory(base, filename)

#Scorm Play
@app.route("/scorm-play/<int:course_id>")
def scorm_play_page(course_id):   
    user_id = request.args.get("user_id", 0)
    force_new = request.args.get("force_new", "0")

    # Look up the actual entry_point from DB
    conn = get_db(); cur = conn.cursor()
    try:
        cur.execute("""
            SELECT entry_point FROM scorm_packages
            WHERE course_id = %s AND lesson_id IS NULL
        """, (course_id,))
        row = cur.fetchone()
        entry_point = row[0] if row else "index.html"
    finally:
        cur.close(); conn.close()

    return f"""
            <!DOCTYPE html>
            <html>
            <head>
            <title>SCORM Player</title>
            <style>
            * {{ margin:0; padding:0; box-sizing:border-box; }}
            html, body {{ width:100%; height:100%; }}
            </style>
            </head>

            <body>

            <script>

            const userId = "{user_id}";
            const forceNew = "{force_new}" === "1";

           window.API = {{
            data: {{}},

            LMSInitialize: function(_) {{
                console.log("LMSInitialize — forceNew:", forceNew);

                if (forceNew) {{
                    // Force fresh start — no saved progress loaded
                    window.API.data["cmi.core.lesson_status"]   = "not attempted";
                    window.API.data["cmi.completion_status"]    = "not attempted";
                    window.API.data["cmi.core.score.raw"]       = 0;
                    window.API.data["cmi.score.raw"]            = 0;
                    window.API.data["cmi.core.lesson_location"] = "";
                    window.API.data["cmi.location"]             = "";
                    window.API.data["cmi.suspend_data"]         = "";
                    window.API.data["cmi.core.entry"]           = "ab-initio";
                    window.API.data["cmi.entry"]                = "ab-initio";
                    console.log("[SCORM Bridge] Force new attempt — starting fresh");
                    return "true";
                }}

                var xhr = new XMLHttpRequest();
                xhr.open("GET", "/api/scorm/{course_id}/progress?user_id=" + userId, false);
                xhr.send();
                if (xhr.status === 200) {{
                    var d = JSON.parse(xhr.responseText);
                    console.log("[SCORM Bridge] Loaded progress:", JSON.stringify(d));

                    // SCORM 1.2
                    window.API.data["cmi.core.lesson_status"]   = d.completion_status || "incomplete";
                    window.API.data["cmi.core.score.raw"]       = d.score || 0;
                    window.API.data["cmi.core.lesson_location"] = d.lesson_location || "";

                    // SCORM 2004
                    window.API.data["cmi.completion_status"]    = d.completion_status || "incomplete";
                    window.API.data["cmi.score.raw"]            = d.score || 0;
                    window.API.data["cmi.location"]             = d.lesson_location || "";

                    // Shared
                    window.API.data["cmi.suspend_data"]         = d.suspend_data || "";

                    // Tell SCORM content to resume if there is saved state
                    window.API.data["cmi.core.entry"] = (d.suspend_data || d.lesson_location) ? "resume" : "ab-initio";
                    window.API.data["cmi.entry"]      = (d.suspend_data || d.lesson_location) ? "resume" : "ab-initio";
                }}
                return "true";
            }},

            LMSGetValue: function(k) {{
                return String(window.API.data[k] || "");
            }},

            LMSSetValue: function(k,v) {{
                window.API.data[k] = v;
                return "true";
            }},

            LMSCommit: function(_) {{

                // Priority: success_status (passed/failed) > lesson_status (if not just 'incomplete') > completion_status
                var ss  = window.API.data["cmi.success_status"] || "";
                var ls  = window.API.data["cmi.core.lesson_status"] || "";
                var cs  = window.API.data["cmi.completion_status"] || "";
                var resolvedStatus = "incomplete";
                if (ss && ss !== "unknown") {{
                    resolvedStatus = ss;
                }} else if (ls && ls !== "incomplete" && ls !== "not attempted") {{
                    resolvedStatus = ls;
                }} else if (cs && cs !== "incomplete" && cs !== "unknown" && cs !== "not attempted") {{
                    resolvedStatus = cs;
                }} else if (ls) {{
                    resolvedStatus = ls;
                }}

                var resolvedScore =
                    parseFloat(
                        window.API.data["cmi.core.score.raw"] ||
                        window.API.data["cmi.score.raw"] ||
                        0
                    ) || 0;
                if (resolvedScore === 0 && window.API.data["cmi.score.scaled"]) {{
                    resolvedScore = parseFloat(window.API.data["cmi.score.scaled"]) * 100;
                }}

                var commitData = {{
                    user_id: parseInt(userId),
                    completion_status: resolvedStatus,
                    score: resolvedScore,
                    suspend_data:
                        window.API.data["cmi.suspend_data"] || "",
                    lesson_location:
                        window.API.data["cmi.location"] ||
                        window.API.data["cmi.core.lesson_location"] ||
                        ""
                }};

                console.log("[SCORM Bridge] LMSCommit data:", JSON.stringify(commitData));
                console.log("[SCORM Bridge] All API.data:", JSON.stringify(window.API.data));

                // Save to backend
                fetch("/api/scorm/{course_id}/progress", {{
                    method: "POST",
                    headers: {{ "Content-Type": "application/json" }},
                    body: JSON.stringify(commitData)
                }});

                // Notify React parent with the latest SCORM data
                window.parent.postMessage({{
                    type: "scorm-commit",
                    data: commitData
                }}, "*");

                return "true";

            }},

            LMSFinish: function(_) {{
                window.API.LMSCommit("");
                return "true";
            }},

            LMSGetLastError: function() {{ return "0"; }},
            LMSGetErrorString: function() {{ return ""; }},
            LMSGetDiagnostic: function() {{ return ""; }}

            }};

            window.API_1484_11 = {{
            Initialize: function(_) {{ return window.API.LMSInitialize(_); }},
            Terminate: function(_) {{ return window.API.LMSFinish(_); }},
            GetValue: function(k) {{ return window.API.LMSGetValue(k); }},
            SetValue: function(k,v) {{ return window.API.LMSSetValue(k,v); }},
            Commit: function(_) {{ return window.API.LMSCommit(_); }},
            GetLastError: function() {{ return "0"; }},
            GetErrorString: function() {{ return ""; }},
            GetDiagnostic: function() {{ return ""; }}
            }};

            window.onload = function() {{
            const iframe = document.createElement("iframe");
            iframe.src = "/scorm_files/{course_id}/{entry_point}";
            iframe.style.width = "100%";
            iframe.style.height = "100vh";
            iframe.style.border = "none";
            document.body.appendChild(iframe);
            }};

            window.addEventListener("message", function(e) {{
                if (e.data && e.data.type === "force-commit") {{
                    console.log("[SCORM Bridge] Force commit triggered by timer");
                    window.API.LMSCommit("");
                }}
            }});

            </script>

            </body>
            </html>
            """
# Route 1 — Upload lesson-level SCORM
@app.route("/api/lessons/<int:lesson_id>/upload-scorm", methods=["POST"])
def upload_lesson_scorm(lesson_id):
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if not file.filename.endswith(".zip"):
        return jsonify({"error": "Only .zip files allowed"}), 400

    conn = get_db(); cur = conn.cursor()

    try:
        # Get course_id via lessons → modules
        cur.execute("""
            SELECT m.course_id 
            FROM lessons l
            JOIN modules m ON l.module_id = m.module_id
            WHERE l.lesson_id = %s
        """, (lesson_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"error": "Lesson not found"}), 404
        course_id = row[0]

        # Extract zip to /scorm_files/course_<id>/lesson_<id>/
        extract_path = os.path.abspath(
            os.path.join("scorm_files", f"course_{course_id}", f"lesson_{lesson_id}")
        ).replace("\\", "/")
        os.makedirs(extract_path, exist_ok=True)

        zip_path = os.path.join(extract_path, "package.zip")
        file.save(zip_path)
        with zipfile.ZipFile(zip_path, "r") as z:
            z.extractall(extract_path)
        os.remove(zip_path)

        # Parse imsmanifest.xml
        manifest_path = os.path.join(extract_path, "imsmanifest.xml")
        if not os.path.exists(manifest_path):
            return jsonify({"error": "imsmanifest.xml not found"}), 400

        tree = ET.parse(manifest_path)
        root = tree.getroot()
        ns = root.tag.split("}")[0].strip("{") if "}" in root.tag else ""
        def tag(name): return f"{{{ns}}}{name}" if ns else name

        version = "scorm_1.2"
        for meta in root.iter(tag("schemaversion")):
            if "2004" in (meta.text or ""):
                version = "scorm_2004"
            break

        entry_point = None
        for resource in root.iter(tag("resource")):
            attrs = {k.split("}")[-1]: v for k, v in resource.attrib.items()}
            scorm_type = attrs.get("scormtype") or attrs.get("adlcp:scormtype", "")
            if "sco" in scorm_type.lower():
                entry_point = attrs.get("href")
                break
        if not entry_point:
            for resource in root.iter(tag("resource")):
                href = resource.attrib.get("href")
                if href:
                    entry_point = href
                    break
        if not entry_point:
            return jsonify({"error": "Could not find entry point in manifest"}), 400

        # Insert into scorm_packages with lesson_id
        # Check if already exists for this lesson
        cur.execute("SELECT id FROM scorm_packages WHERE lesson_id = %s", (lesson_id,))
        existing = cur.fetchone()
        if existing:
            cur.execute("""
                UPDATE scorm_packages
                SET file_path = %s, entry_point = %s, version = %s, uploaded_at = CURRENT_TIMESTAMP
                WHERE lesson_id = %s
                RETURNING id
            """, (extract_path, entry_point, version, lesson_id))
        else:
            cur.execute("""
                INSERT INTO scorm_packages (course_id, lesson_id, file_path, entry_point, version)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (course_id, lesson_id, extract_path, entry_point, version))

        scorm_id = cur.fetchone()[0]

        # Update lesson scorm_id and content_type
        cur.execute("""
            UPDATE lessons 
            SET scorm_id = %s, content_type = 'scorm'
            WHERE lesson_id = %s
        """, (scorm_id, lesson_id))

        conn.commit()
        return jsonify({
            "success": True,
            "scorm_id": scorm_id,
            "entry_point": entry_point,
            "version": version
        })

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close(); conn.close()
        
# Get lesson SCORM launch info
@app.route("/api/lessons/<int:lesson_id>/scorm-launch", methods=["GET"])
def lesson_scorm_launch(lesson_id):
    conn = get_db(); cur = conn.cursor()
    try:
        cur.execute("""
            SELECT sp.file_path, sp.entry_point, sp.version, sp.course_id
            FROM scorm_packages sp
            WHERE sp.lesson_id = %s
        """, (lesson_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"error": "No SCORM package found for this lesson"}), 404
        return jsonify({
            "base_url": f"/scorm_files/course_{row[3]}/lesson_{lesson_id}/",
            "entry_point": row[1],
            "version": row[2]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close(); conn.close()
# Lesson SCORM player page
@app.route("/lesson-scorm-play/<int:lesson_id>")
def lesson_scorm_play_page(lesson_id):
    user_id = request.args.get("user_id", "0")
    force_new = request.args.get("force_new", "0")

    # Get course_id and entry_point
    conn = get_db(); cur = conn.cursor()
    try:
        cur.execute("""
            SELECT sp.entry_point, sp.course_id
            FROM scorm_packages sp
            WHERE sp.lesson_id = %s
        """, (lesson_id,))
        row = cur.fetchone()
        if not row:
            return "SCORM package not found", 404
        entry_point = row[0]
        course_id = row[1]
    finally:
        cur.close(); conn.close()

    return f"""
<!DOCTYPE html>
<html>
<head>
  <title>SCORM Lesson</title>
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    html, body, iframe {{ width: 100%; height: 100vh; border: none; }}
  </style>
</head>
<body>
<script>
  const userId = "{user_id}";
  const forceNew = "{force_new}" === "1";
  window.API = {{
    data: {{}},
    LMSInitialize: function(_) {{
      console.log("LMSInitialize — forceNew:", forceNew);

      if (forceNew) {{
        // Force fresh start — no saved progress loaded
        window.API.data["cmi.core.lesson_status"]   = "not attempted";
        window.API.data["cmi.completion_status"]    = "not attempted";
        window.API.data["cmi.core.score.raw"]       = 0;
        window.API.data["cmi.score.raw"]            = 0;
        window.API.data["cmi.core.lesson_location"] = "";
        window.API.data["cmi.location"]             = "";
        window.API.data["cmi.suspend_data"]         = "";
        window.API.data["cmi.core.entry"]           = "ab-initio";
        window.API.data["cmi.entry"]                = "ab-initio";
        console.log("[SCORM Bridge 2] Force new attempt — starting fresh");
        return "true";
      }}

      const xhr = new XMLHttpRequest();
      xhr.open("GET", "/api/scorm/{course_id}/progress?user_id=" + userId + "&lesson_id={lesson_id}", false);
      xhr.send();
      if (xhr.status === 200) {{
        const d = JSON.parse(xhr.responseText);
        console.log("[SCORM Bridge 2] Loaded progress:", JSON.stringify(d));

        // SCORM 1.2
        window.API.data["cmi.core.lesson_status"]   = d.completion_status || "incomplete";
        window.API.data["cmi.core.score.raw"]        = d.score || 0;
        window.API.data["cmi.core.lesson_location"]  = d.lesson_location || "";

        // SCORM 2004
        window.API.data["cmi.completion_status"]     = d.completion_status || "incomplete";
        window.API.data["cmi.score.raw"]             = d.score || 0;
        window.API.data["cmi.location"]              = d.lesson_location || "";

        // Shared
        window.API.data["cmi.suspend_data"]          = d.suspend_data || "";

        // Tell SCORM content to resume if there is saved state
        window.API.data["cmi.core.entry"] = (d.suspend_data || d.lesson_location) ? "resume" : "ab-initio";
        window.API.data["cmi.entry"]      = (d.suspend_data || d.lesson_location) ? "resume" : "ab-initio";
      }}
      return "true";
    }},
    LMSFinish:        function(_) {{ window.API.LMSCommit(""); return "true"; }},
    LMSGetValue:      function(k) {{ return String(window.API.data[k] || ""); }},
    LMSSetValue:      function(k,v) {{ window.API.data[k] = v; return "true"; }},
    LMSCommit:        function(_) {{
      var ss  = window.API.data["cmi.success_status"] || "";
      var ls  = window.API.data["cmi.core.lesson_status"] || "";
      var cs  = window.API.data["cmi.completion_status"] || "";
      var resolvedStatus = "incomplete";
      if (ss && ss !== "unknown") {{
          resolvedStatus = ss;
      }} else if (ls && ls !== "incomplete" && ls !== "not attempted") {{
          resolvedStatus = ls;
      }} else if (cs && cs !== "incomplete" && cs !== "unknown" && cs !== "not attempted") {{
          resolvedStatus = cs;
      }} else if (ls) {{
          resolvedStatus = ls;
      }}
      var resolvedScore =
          parseFloat(window.API.data["cmi.core.score.raw"] || window.API.data["cmi.score.raw"] || 0) || 0;
      if (resolvedScore === 0 && window.API.data["cmi.score.scaled"]) {{
          resolvedScore = parseFloat(window.API.data["cmi.score.scaled"]) * 100;
      }}
      var commitData = {{
        user_id: parseInt(userId),
        lesson_id: {lesson_id},
        completion_status: resolvedStatus,
        score: resolvedScore,
        suspend_data: window.API.data["cmi.suspend_data"] || "",
        lesson_location: window.API.data["cmi.location"] || window.API.data["cmi.core.lesson_location"] || ""
      }};
      console.log("[SCORM Bridge 2] LMSCommit data:", JSON.stringify(commitData));
      console.log("[SCORM Bridge 2] All API.data:", JSON.stringify(window.API.data));
      fetch("/api/scorm/{course_id}/progress", {{
        method: "POST",
        headers: {{"Content-Type": "application/json"}},
        body: JSON.stringify(commitData)
      }});
      window.parent.postMessage({{ type: "scorm-commit", data: commitData }}, "*");
      return "true";
    }},
    LMSGetLastError:   function() {{ return "0"; }},
    LMSGetErrorString: function() {{ return ""; }},
    LMSGetDiagnostic:  function() {{ return ""; }}
  }};
  window.API_1484_11 = {{
    Initialize: function(_) {{ return window.API.LMSInitialize(_); }},
    Terminate:  function(_) {{ return window.API.LMSFinish(_); }},
    GetValue:   function(k) {{ return window.API.LMSGetValue(k); }},
    SetValue:   function(k,v) {{ return window.API.LMSSetValue(k,v); }},
    Commit:     function(_) {{ return window.API.LMSCommit(_); }},
    GetLastError:   function() {{ return "0"; }},
    GetErrorString: function() {{ return ""; }},
    GetDiagnostic:  function() {{ return ""; }}
  }};

  window.addEventListener("message", function(e) {{
    if (e.data && e.data.type === "force-commit") {{
      console.log("[SCORM Bridge 2] Force commit triggered by timer");
      window.API.LMSCommit("");
    }}
  }});
</script>
<iframe src="/scorm_files/course_{course_id}/lesson_{lesson_id}/{entry_point}" allowfullscreen></iframe>
</body>
</html>
"""
# — Serve lesson SCORM static files
@app.route("/scorm_files/course_<int:course_id>/lesson_<int:lesson_id>/<path:filename>")
def serve_lesson_scorm(course_id, lesson_id, filename):
    base = os.path.abspath(os.path.join("scorm_files", f"course_{course_id}", f"lesson_{lesson_id}"))
    return send_from_directory(base, filename)


#scorm settngs and attemp history
@app.route("/api/courses/<int:course_id>/scorm-settings", methods=["GET"])
def get_scorm_settings(course_id):
    conn = get_db(); cur = conn.cursor()
    lesson_id = request.args.get("lesson_id")
    try:
        if lesson_id:
            cur.execute("""
                SELECT max_attempts, force_new_attempt, lock_after_final,
                       grading_method, passing_score, time_limit
                FROM scorm_settings WHERE course_id = %s AND lesson_id = %s
            """, (course_id, lesson_id))
        else:
            cur.execute("""
                SELECT max_attempts, force_new_attempt, lock_after_final,
                       grading_method, passing_score, time_limit
                FROM scorm_settings WHERE course_id = %s AND lesson_id IS NULL
            """, (course_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({
                "course_id": course_id,
                "max_attempts": None,
                "force_new_attempt": False,
                "lock_after_final": False,
                "grading_method": "highest",
                "passing_score": 40.0,
                "time_limit": None
            })
        return jsonify({
            "course_id":         course_id,
            "max_attempts":      row[0],
            "force_new_attempt": row[1],
            "lock_after_final":  row[2],
            "grading_method":    row[3],
            "passing_score":     row[4],
            "time_limit":        row[5]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close(); conn.close()


# @app.route("/api/courses/<int:course_id>/scorm-settings", methods=["POST"])
# def save_scorm_settings(course_id):
#     conn = get_db(); cur = conn.cursor()
#     data = request.json
#     lesson_id = data.get("lesson_id")  # None for course-level
#     try:
#         # Manual upsert (handles NULL lesson_id correctly)
#         if lesson_id:
#             cur.execute("SELECT id FROM scorm_settings WHERE course_id = %s AND lesson_id = %s", (course_id, lesson_id))
#         else:
#             cur.execute("SELECT id FROM scorm_settings WHERE course_id = %s AND lesson_id IS NULL", (course_id,))

#         existing = cur.fetchone()

#         if existing:
#             if lesson_id:
#                 cur.execute("""
#                     UPDATE scorm_settings SET
#                         max_attempts = %s, force_new_attempt = %s, lock_after_final = %s,
#                         grading_method = %s, passing_score = %s, time_limit = %s
#                     WHERE course_id = %s AND lesson_id = %s
#                 """, (
#                     data.get("max_attempts"), data.get("force_new_attempt", False),
#                     data.get("lock_after_final", False), data.get("grading_method", "highest"),
#                     data.get("passing_score", 40.0), data.get("time_limit"),
#                     course_id, lesson_id
#                 ))
#             else:
#                 cur.execute("""
#                     UPDATE scorm_settings SET
#                         max_attempts = %s, force_new_attempt = %s, lock_after_final = %s,
#                         grading_method = %s, passing_score = %s, time_limit = %s
#                     WHERE course_id = %s AND lesson_id IS NULL
#                 """, (
#                     data.get("max_attempts"), data.get("force_new_attempt", False),
#                     data.get("lock_after_final", False), data.get("grading_method", "highest"),
#                     data.get("passing_score", 40.0), data.get("time_limit"),
#                     course_id
#                 ))
#         else:
#             cur.execute("""
#                 INSERT INTO scorm_settings
#                     (course_id, lesson_id, max_attempts, force_new_attempt, lock_after_final,
#                      grading_method, passing_score, time_limit)
#                 VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
#             """, (
#                 course_id, lesson_id,
#                 data.get("max_attempts"), data.get("force_new_attempt", False),
#                 data.get("lock_after_final", False), data.get("grading_method", "highest"),
#                 data.get("passing_score", 40.0), data.get("time_limit")
#             ))

#         conn.commit()
#         return jsonify({"success": True})
#     except Exception as e:
#         conn.rollback()
#         print("SCORM SETTINGS ERROR:", e)  # 👈 add this line
#         return jsonify({"error": str(e)}), 500
#     finally:
#         cur.close(); conn.close()

@app.route("/api/courses/<int:course_id>/scorm-settings", methods=["POST"])
def save_scorm_settings(course_id):
    conn = get_db(); cur = conn.cursor()
    data = request.json
    lesson_id = data.get("lesson_id")
    try:
        if lesson_id:
            cur.execute("""
                INSERT INTO scorm_settings
                    (course_id, lesson_id, max_attempts, force_new_attempt, lock_after_final,
                     grading_method, passing_score, time_limit)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (course_id, lesson_id) WHERE lesson_id IS NOT NULL DO UPDATE SET
                    max_attempts      = EXCLUDED.max_attempts,
                    force_new_attempt = EXCLUDED.force_new_attempt,
                    lock_after_final  = EXCLUDED.lock_after_final,
                    grading_method    = EXCLUDED.grading_method,
                    passing_score     = EXCLUDED.passing_score,
                    time_limit        = EXCLUDED.time_limit
            """, (
                course_id, lesson_id,
                data.get("max_attempts"),
                data.get("force_new_attempt", False),
                data.get("lock_after_final", False),
                data.get("grading_method", "highest"),
                data.get("passing_score", 40.0),
                data.get("time_limit"),
            ))
        else:
            cur.execute("""
                INSERT INTO scorm_settings
                    (course_id, max_attempts, force_new_attempt, lock_after_final,
                     grading_method, passing_score, time_limit)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (course_id) WHERE lesson_id IS NULL DO UPDATE SET
                    max_attempts      = EXCLUDED.max_attempts,
                    force_new_attempt = EXCLUDED.force_new_attempt,
                    lock_after_final  = EXCLUDED.lock_after_final,
                    grading_method    = EXCLUDED.grading_method,
                    passing_score     = EXCLUDED.passing_score,
                    time_limit        = EXCLUDED.time_limit
            """, (
                course_id,
                data.get("max_attempts"),
                data.get("force_new_attempt", False),
                data.get("lock_after_final", False),
                data.get("grading_method", "highest"),
                data.get("passing_score", 40.0),
                data.get("time_limit"),
            ))
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        conn.rollback()
        print("SCORM SETTINGS ERROR:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close(); conn.close()















#───────────────────────────────────────────────────SCORM ATTEMPTS─────────────────────────────────────────────────────

# LOG a completed attempt (insert-only — called on exit or test finish)
@app.route("/api/scorm/<int:course_id>/attempts", methods=["POST"])
def log_scorm_attempt(course_id):
    data = request.json
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    conn = get_db(); cur = conn.cursor()
    try:
        # Get the next attempt number for this user + course + lesson
        lesson_id = data.get("lesson_id")  # None for course-level
        if lesson_id:
            cur.execute("""
                SELECT COALESCE(MAX(attempt_number), 0) + 1
                FROM scorm_attempts
                WHERE user_id = %s AND course_id = %s AND lesson_id = %s
            """, (user_id, course_id, lesson_id))
        else:
            cur.execute("""
                SELECT COALESCE(MAX(attempt_number), 0) + 1
                FROM scorm_attempts
                WHERE user_id = %s AND course_id = %s AND lesson_id IS NULL
            """, (user_id, course_id))
        next_attempt = cur.fetchone()[0]

        # Check max_attempts from scorm_settings (if set)
        if lesson_id:
            cur.execute("SELECT max_attempts FROM scorm_settings WHERE course_id = %s AND lesson_id = %s", (course_id, lesson_id))
        else:
            cur.execute("SELECT max_attempts FROM scorm_settings WHERE course_id = %s AND lesson_id IS NULL", (course_id,))
        settings_row = cur.fetchone()
        max_attempts = settings_row[0] if settings_row else None

        if max_attempts is not None and next_attempt > max_attempts:
            return jsonify({"error": "Maximum attempts reached", "max_attempts": max_attempts}), 403

        # Capture final state from the SCORM session
        score = data.get("score", 0)
        completion_status = data.get("completion_status", "incomplete")
        suspend_data = data.get("suspend_data", "")
        lesson_location = data.get("lesson_location", "")
        started_at = data.get("started_at")  # ISO timestamp from frontend

        # Insert the attempt — this row is NEVER updated
        # completed_at is always NOW() since this is only called at exit / test finish
        if started_at:
            cur.execute("""
                INSERT INTO scorm_attempts
                    (user_id, course_id, lesson_id, attempt_number, score, completion_status,
                     started_at, completed_at, last_accessed, suspend_data, lesson_location)
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW(), %s, %s)
                RETURNING attempt_id
            """, (user_id, course_id, lesson_id, next_attempt, score, completion_status, started_at, suspend_data, lesson_location))
        else:
            cur.execute("""
                INSERT INTO scorm_attempts
                    (user_id, course_id, lesson_id, attempt_number, score, completion_status,
                     started_at, completed_at, last_accessed, suspend_data, lesson_location)
                VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW(), NOW(), %s, %s)
                RETURNING attempt_id
            """, (user_id, course_id, lesson_id, next_attempt, score, completion_status, suspend_data, lesson_location))

        attempt_id = cur.fetchone()[0]

        # Link this attempt to scorm_progress
        if lesson_id:
            cur.execute("""
                UPDATE scorm_progress
                SET last_attempt_id = %s
                WHERE user_id = %s AND course_id = %s AND lesson_id = %s
            """, (attempt_id, user_id, course_id, lesson_id))
        else:
            cur.execute("""
                UPDATE scorm_progress
                SET last_attempt_id = %s
                WHERE user_id = %s AND course_id = %s AND lesson_id IS NULL
            """, (attempt_id, user_id, course_id))

        conn.commit()

        return jsonify({
            "attempt_id": attempt_id,
            "attempt_number": next_attempt,
            "max_attempts": max_attempts
        })
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close(); conn.close()


# GET all attempts for a user + course  (also returns max_attempts for lockout checks)
@app.route("/api/scorm/<int:course_id>/attempts", methods=["GET"])
def get_scorm_attempts(course_id):
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    conn = get_db(); cur = conn.cursor()
    lesson_id = request.args.get("lesson_id")
    try:
        # Fetch attempts
        if lesson_id:
            cur.execute("""
                SELECT attempt_id, attempt_number, score, completion_status,
                       started_at, completed_at, last_accessed
                FROM scorm_attempts
                WHERE user_id = %s AND course_id = %s AND lesson_id = %s
                ORDER BY attempt_number DESC
            """, (user_id, course_id, lesson_id))
        else:
            cur.execute("""
                SELECT attempt_id, attempt_number, score, completion_status,
                       started_at, completed_at, last_accessed
                FROM scorm_attempts
                WHERE user_id = %s AND course_id = %s AND lesson_id IS NULL
                ORDER BY attempt_number DESC
            """, (user_id, course_id))
        cols = [d[0] for d in cur.description]
        rows = []
        for r in cur.fetchall():
            row = dict(zip(cols, r))
            for key in ("started_at", "completed_at", "last_accessed"):
                if row[key]:
                    row[key] = row[key].isoformat()
            rows.append(row)

        # Fetch max_attempts from settings
        if lesson_id:
            cur.execute("SELECT max_attempts FROM scorm_settings WHERE course_id = %s AND lesson_id = %s", (course_id, lesson_id))
        else:
            cur.execute("SELECT max_attempts FROM scorm_settings WHERE course_id = %s AND lesson_id IS NULL", (course_id,))
        settings_row = cur.fetchone()
        max_attempts = settings_row[0] if settings_row else None

        return jsonify({
            "attempts": rows,
            "max_attempts": max_attempts,
            "total_attempts": len(rows),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close(); conn.close()


#Check  Backend ON/OFF         
@app.route("/")
def home():
    return "Backend running successfully 🚀"

# ==========================================================
# REPORTING & PROGRESS APIs
# ==========================================================

@app.route("/api/reports/list-courses", methods=["GET"])
def list_courses_for_reports():
    conn = get_db(); cur = conn.cursor()
    try:
        cur.execute("SELECT course_id, title FROM courses ORDER BY title ASC")
        return jsonify([{"course_id": row[0], "title": row[1]} for row in cur.fetchall()])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close(); conn.close()

@app.route("/api/reports/list-users", methods=["GET"])
def list_users_for_reports():
    conn = get_db(); cur = conn.cursor()
    try:
        cur.execute("SELECT id, firstname, lastname, email FROM users ORDER BY firstname ASC")
        return jsonify([{
            "user_id": row[0], 
            "name": f"{row[1] or ''} {row[2] or ''}".strip() or row[3],
            "email": row[3]
        } for row in cur.fetchall()])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close(); conn.close()

# 1. View Progress BY COURSE (See all users in a specific course)
@app.route("/api/reports/courses/<int:course_id>/users", methods=["GET"])
def get_course_users_progress(course_id):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT 
                u.id AS user_id,
                u.firstname,
                u.lastname,
                u.email,
                MAX(sp.last_accessed) AS last_active,
                MAX(sp.score) AS highest_score,
                STRING_AGG(DISTINCT sp.completion_status, ', ') AS statuses,
                MAX(COALESCE(ss.passing_score, 40)) AS pass_limit
            FROM users u
            JOIN scorm_progress sp ON u.id = sp.user_id
            LEFT JOIN scorm_settings ss ON ss.course_id = sp.course_id 
                AND (ss.lesson_id::TEXT = sp.lesson_id OR (ss.lesson_id IS NULL AND sp.lesson_id IS NULL))
            WHERE sp.course_id = %s
            GROUP BY u.id, u.firstname, u.lastname, u.email
            ORDER BY last_active DESC
        """, (course_id,))
        
        users_progress = []
        for row in cur.fetchall():
            highest_score = row[5] or 0
            statuses = row[6] or ""
            pass_limit = row[7] or 40
            
            if highest_score >= pass_limit:
                final_status = "passed"
            elif "passed" in statuses:
                final_status = "passed"
            else:
                final_status = statuses or "incomplete"
                
            users_progress.append({
                "user_id": row[0],
                "name": f"{row[1] or ''} {row[2] or ''}".strip(),
                "email": row[3],
                "last_active": row[4].strftime("%Y-%m-%d %H:%M:%S") if row[4] else None,
                "highest_score": highest_score,
                "status": final_status
            })
            
        return jsonify({"course_id": course_id, "users": users_progress})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

# 2. View Progress BY USER (See all courses a specific user belongs to)
@app.route("/api/reports/users/<int:user_id>/courses", methods=["GET"])
def get_user_courses_progress(user_id):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT 
                c.course_id,
                c.title,
                c.category,
                MAX(sp.last_accessed) AS last_accessed,
                MAX(sp.score) AS best_score,
                STRING_AGG(DISTINCT sp.completion_status, ', ') AS statuses,
                MAX(COALESCE(ss.passing_score, 40)) AS pass_limit
            FROM courses c
            JOIN scorm_progress sp ON c.course_id = sp.course_id
            LEFT JOIN scorm_settings ss ON ss.course_id = sp.course_id 
                AND (ss.lesson_id::TEXT = sp.lesson_id OR (ss.lesson_id IS NULL AND sp.lesson_id IS NULL))
            WHERE sp.user_id = %s
            GROUP BY c.course_id, c.title, c.category
            ORDER BY last_accessed DESC
        """, (user_id,))
        
        courses_progress = []
        for row in cur.fetchall():
            best_score = row[4] or 0
            statuses = row[5] or ""
            pass_limit = row[6] or 40
            
            if best_score >= pass_limit:
                final_status = "passed"
            elif "passed" in statuses:
                final_status = "passed"
            else:
                final_status = statuses or "incomplete"
                
            courses_progress.append({
                "course_id": row[0],
                "title": row[1],
                "category": row[2],
                "last_accessed": row[3].strftime("%Y-%m-%d %H:%M:%S") if row[3] else None,
                "best_score": best_score,
                "status": final_status
            })
            
        return jsonify({"user_id": user_id, "courses": courses_progress})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=port)
    
    





