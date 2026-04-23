diff --git a/app.py b/app.py
index 9a75753979bc1261d5f3a98f9f0e66ae308cdc68..5dbbb37abb63696f7a00d287af52d7cae27331fb 100644
--- a/app.py
+++ b/app.py
@@ -1,53 +1,670 @@
-from flask import Flask, render_template, request, flash, redirect, url_for
-
-app = Flask(__name__)
-app.secret_key = 'your_secret_key_here'  # Replace with a secure secret key
-
-def calculate_pallets(total_boxes, boxes_per_layer, layers_per_pallet):
-    """
-    Calculates:
-      - total boxes,
-      - full pallets,
-      - leftover boxes,
-      - full layers on the last (partial) pallet, and 
-      - boxes on the final layer.
-    """
-    boxes_per_pallet_total = boxes_per_layer * layers_per_pallet
-
-    full_pallets = total_boxes // boxes_per_pallet_total
-    leftover_boxes = total_boxes % boxes_per_pallet_total
-
-    full_layers_on_partial_pallet = leftover_boxes // boxes_per_layer
-    boxes_on_final_layer = leftover_boxes % boxes_per_layer
-
-    return {
-        "total_boxes": total_boxes,
-        "full_pallets": full_pallets,
-        "leftover_boxes": leftover_boxes,
-        "full_layers": full_layers_on_partial_pallet,
-        "final_layer": boxes_on_final_layer,
-    }
-
-@app.route("/", methods=["GET", "POST"])
-def pallet_calculator():
-    if request.method == "POST":
-        try:
-            total_boxes = int(request.form["total_boxes"])
-            boxes_per_layer = int(request.form["boxes_per_layer"])
-            layers_per_pallet = int(request.form["layers_per_pallet"])
-
-            if total_boxes <= 0 or boxes_per_layer <= 0 or layers_per_pallet <= 0:
-                flash("All input values must be positive numbers.", "danger")
-                return redirect(url_for("pallet_calculator"))
-
-            result = calculate_pallets(total_boxes, boxes_per_layer, layers_per_pallet)
-            return render_template("index.html", result=result)
-
-        except ValueError:
-            flash("Please enter valid integer values.", "danger")
-            return redirect(url_for("pallet_calculator"))
-
-    return render_template("index.html")
-
-if __name__ == "__main__":
-    app.run(debug=True)
\ No newline at end of file
+import os
+import sqlite3
+from functools import wraps
+from pathlib import Path
+from uuid import uuid4
+
+from flask import (
+    Flask,
+    flash,
+    g,
+    redirect,
+    render_template,
+    request,
+    session,
+    url_for,
+)
+from werkzeug.security import check_password_hash, generate_password_hash
+
+BASE_DIR = Path(__file__).resolve().parent
+DB_PATH = BASE_DIR / "portal.db"
+UPLOAD_DIR = BASE_DIR / "uploads"
+UPLOAD_DIR.mkdir(exist_ok=True)
+
+app = Flask(__name__)
+app.secret_key = "tru-blu-local-dev-secret"
+app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024
+
+ROLES = {"worker", "admin", "owner"}
+JOB_STATUSES = {"pending", "approved", "rejected"}
+
+
+def get_db() -> sqlite3.Connection:
+    if "db" not in g:
+        conn = sqlite3.connect(DB_PATH)
+        conn.row_factory = sqlite3.Row
+        g.db = conn
+    return g.db
+
+
+@app.teardown_appcontext
+def close_db(_error):
+    db = g.pop("db", None)
+    if db:
+        db.close()
+
+
+def init_db() -> None:
+    db = sqlite3.connect(DB_PATH)
+    db.row_factory = sqlite3.Row
+    db.executescript(
+        """
+        CREATE TABLE IF NOT EXISTS users (
+            id INTEGER PRIMARY KEY AUTOINCREMENT,
+            username TEXT UNIQUE NOT NULL,
+            password_hash TEXT NOT NULL,
+            role TEXT NOT NULL CHECK(role IN ('worker','admin','owner')),
+            active INTEGER NOT NULL DEFAULT 1
+        );
+
+        CREATE TABLE IF NOT EXISTS staff (
+            id INTEGER PRIMARY KEY AUTOINCREMENT,
+            user_id INTEGER UNIQUE,
+            full_name TEXT NOT NULL,
+            phone TEXT,
+            FOREIGN KEY(user_id) REFERENCES users(id)
+        );
+
+        CREATE TABLE IF NOT EXISTS sites (
+            id INTEGER PRIMARY KEY AUTOINCREMENT,
+            name TEXT UNIQUE NOT NULL,
+            address TEXT NOT NULL,
+            active INTEGER NOT NULL DEFAULT 1
+        );
+
+        CREATE TABLE IF NOT EXISTS rate_tables (
+            id INTEGER PRIMARY KEY AUTOINCREMENT,
+            label TEXT UNIQUE NOT NULL,
+            rate_per_container REAL NOT NULL,
+            active INTEGER NOT NULL DEFAULT 1
+        );
+
+        CREATE TABLE IF NOT EXISTS pay_periods (
+            id INTEGER PRIMARY KEY AUTOINCREMENT,
+            name TEXT UNIQUE NOT NULL,
+            start_date TEXT NOT NULL,
+            end_date TEXT NOT NULL,
+            is_locked INTEGER NOT NULL DEFAULT 0
+        );
+
+        CREATE TABLE IF NOT EXISTS container_jobs (
+            id INTEGER PRIMARY KEY AUTOINCREMENT,
+            worker_id INTEGER NOT NULL,
+            site_id INTEGER NOT NULL,
+            pay_period_id INTEGER,
+            container_ref TEXT NOT NULL,
+            job_date TEXT NOT NULL,
+            containers_unloaded INTEGER NOT NULL,
+            notes TEXT,
+            issue_notes TEXT,
+            photo_path TEXT,
+            status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
+            reviewed_by INTEGER,
+            review_notes TEXT,
+            override_rate REAL,
+            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
+            FOREIGN KEY(worker_id) REFERENCES users(id),
+            FOREIGN KEY(site_id) REFERENCES sites(id),
+            FOREIGN KEY(pay_period_id) REFERENCES pay_periods(id),
+            FOREIGN KEY(reviewed_by) REFERENCES users(id)
+        );
+
+        CREATE TABLE IF NOT EXISTS toolbox_meetings (
+            id INTEGER PRIMARY KEY AUTOINCREMENT,
+            worker_id INTEGER NOT NULL,
+            site_id INTEGER NOT NULL,
+            meeting_date TEXT NOT NULL,
+            topic TEXT NOT NULL,
+            details TEXT NOT NULL,
+            status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
+            reviewed_by INTEGER,
+            review_notes TEXT,
+            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
+            FOREIGN KEY(worker_id) REFERENCES users(id),
+            FOREIGN KEY(site_id) REFERENCES sites(id),
+            FOREIGN KEY(reviewed_by) REFERENCES users(id)
+        );
+        """
+    )
+
+    existing = db.execute("SELECT COUNT(*) AS c FROM users").fetchone()["c"]
+    if existing == 0:
+        users = [
+            ("owner", generate_password_hash("owner123"), "owner"),
+            ("admin", generate_password_hash("admin123"), "admin"),
+            ("worker1", generate_password_hash("worker123"), "worker"),
+            ("worker2", generate_password_hash("worker123"), "worker"),
+        ]
+        db.executemany("INSERT INTO users(username, password_hash, role) VALUES(?,?,?)", users)
+
+        for username, full_name, phone in [
+            ("owner", "Tru Blu Owner", "555-0100"),
+            ("admin", "Operations Admin", "555-0101"),
+            ("worker1", "Alex Worker", "555-0102"),
+            ("worker2", "Sam Worker", "555-0103"),
+        ]:
+            user_id = db.execute("SELECT id FROM users WHERE username=?", (username,)).fetchone()["id"]
+            db.execute(
+                "INSERT INTO staff(user_id, full_name, phone) VALUES(?,?,?)",
+                (user_id, full_name, phone),
+            )
+
+        db.executemany(
+            "INSERT INTO sites(name, address) VALUES(?, ?)",
+            [
+                ("Houston Yard", "1200 Harbor Rd, Houston, TX"),
+                ("Pasadena Dock", "83 Wharf Ave, Pasadena, TX"),
+            ],
+        )
+
+        db.executemany(
+            "INSERT INTO rate_tables(label, rate_per_container) VALUES(?, ?)",
+            [("Standard", 75.0), ("Heavy Load", 95.0)],
+        )
+
+        db.execute(
+            "INSERT INTO pay_periods(name, start_date, end_date, is_locked) VALUES(?,?,?,0)",
+            ("Apr 16-30 2026", "2026-04-16", "2026-04-30"),
+        )
+
+    db.commit()
+    db.close()
+
+
+def current_user():
+    uid = session.get("user_id")
+    if not uid:
+        return None
+    return get_db().execute(
+        "SELECT id, username, role, active FROM users WHERE id=?", (uid,)
+    ).fetchone()
+
+
+def login_required(view):
+    @wraps(view)
+    def wrapped(*args, **kwargs):
+        if not current_user():
+            return redirect(url_for("login"))
+        return view(*args, **kwargs)
+
+    return wrapped
+
+
+def roles_required(*allowed):
+    def decorator(view):
+        @wraps(view)
+        def wrapped(*args, **kwargs):
+            user = current_user()
+            if not user:
+                return redirect(url_for("login"))
+            if user["role"] not in allowed:
+                flash("You do not have permission for that page.", "danger")
+                return redirect(url_for("dashboard"))
+            return view(*args, **kwargs)
+
+        return wrapped
+
+    return decorator
+
+
+def save_upload(file_storage):
+    if not file_storage or not file_storage.filename:
+        return None
+    ext = Path(file_storage.filename).suffix.lower()
+    safe_name = f"{uuid4().hex}{ext}"
+    out_path = UPLOAD_DIR / safe_name
+    file_storage.save(out_path)
+    return f"uploads/{safe_name}"
+
+
+@app.route("/", methods=["GET", "POST"])
+def login():
+    if request.method == "POST":
+        username = request.form.get("username", "").strip()
+        password = request.form.get("password", "")
+        user = get_db().execute(
+            "SELECT id, username, password_hash, role, active FROM users WHERE username=?",
+            (username,),
+        ).fetchone()
+        if not user or not check_password_hash(user["password_hash"], password):
+            flash("Invalid username or password.", "danger")
+            return render_template("login.html")
+        if not user["active"]:
+            flash("Your account is inactive.", "danger")
+            return render_template("login.html")
+        session.clear()
+        session["user_id"] = user["id"]
+        return redirect(url_for("dashboard"))
+    return render_template("login.html")
+
+
+@app.route("/logout")
+def logout():
+    session.clear()
+    return redirect(url_for("login"))
+
+
+@app.route("/dashboard")
+@login_required
+def dashboard():
+    user = current_user()
+    db = get_db()
+
+    if user["role"] == "worker":
+        job_count = db.execute(
+            "SELECT COUNT(*) AS c FROM container_jobs WHERE worker_id=?", (user["id"],)
+        ).fetchone()["c"]
+        toolbox_count = db.execute(
+            "SELECT COUNT(*) AS c FROM toolbox_meetings WHERE worker_id=?", (user["id"],)
+        ).fetchone()["c"]
+    else:
+        job_count = db.execute("SELECT COUNT(*) AS c FROM container_jobs").fetchone()["c"]
+        toolbox_count = db.execute("SELECT COUNT(*) AS c FROM toolbox_meetings").fetchone()["c"]
+
+    return render_template(
+        "dashboard.html",
+        user=user,
+        job_count=job_count,
+        toolbox_count=toolbox_count,
+    )
+
+
+@app.route("/jobs/new", methods=["GET", "POST"])
+@roles_required("worker", "admin", "owner")
+def new_job():
+    db = get_db()
+    user = current_user()
+    sites = db.execute("SELECT id, name FROM sites WHERE active=1 ORDER BY name").fetchall()
+    pay_periods = db.execute(
+        "SELECT id, name FROM pay_periods WHERE is_locked=0 ORDER BY start_date DESC"
+    ).fetchall()
+
+    if request.method == "POST":
+        containers = int(request.form.get("containers_unloaded", "0"))
+        if containers <= 0:
+            flash("Containers unloaded must be greater than 0.", "danger")
+            return render_template("job_form.html", sites=sites, pay_periods=pay_periods)
+
+        photo_path = save_upload(request.files.get("issue_photo"))
+        db.execute(
+            """
+            INSERT INTO container_jobs(
+                worker_id, site_id, pay_period_id, container_ref, job_date,
+                containers_unloaded, notes, issue_notes, photo_path
+            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
+            """,
+            (
+                user["id"],
+                request.form.get("site_id"),
+                request.form.get("pay_period_id") or None,
+                request.form.get("container_ref", "").strip(),
+                request.form.get("job_date"),
+                containers,
+                request.form.get("notes", "").strip(),
+                request.form.get("issue_notes", "").strip(),
+                photo_path,
+            ),
+        )
+        db.commit()
+        flash("Container job submitted.", "success")
+        return redirect(url_for("jobs"))
+
+    return render_template("job_form.html", sites=sites, pay_periods=pay_periods)
+
+
+@app.route("/jobs")
+@login_required
+def jobs():
+    db = get_db()
+    user = current_user()
+    params = []
+    where = ""
+    if user["role"] == "worker":
+        where = "WHERE j.worker_id=?"
+        params.append(user["id"])
+
+    rows = db.execute(
+        f"""
+        SELECT j.*, u.username AS worker_username, s.name AS site_name,
+               r.username AS reviewer_username
+        FROM container_jobs j
+        JOIN users u ON u.id=j.worker_id
+        JOIN sites s ON s.id=j.site_id
+        LEFT JOIN users r ON r.id=j.reviewed_by
+        {where}
+        ORDER BY j.created_at DESC
+        """,
+        params,
+    ).fetchall()
+    return render_template("jobs.html", rows=rows, user=user)
+
+
+@app.route("/jobs/<int:job_id>/edit", methods=["GET", "POST"])
+@roles_required("admin", "owner")
+def edit_job(job_id: int):
+    db = get_db()
+    job = db.execute("SELECT * FROM container_jobs WHERE id=?", (job_id,)).fetchone()
+    if not job:
+        flash("Job not found.", "danger")
+        return redirect(url_for("jobs"))
+
+    sites = db.execute("SELECT id, name FROM sites WHERE active=1 ORDER BY name").fetchall()
+    pay_periods = db.execute("SELECT id, name FROM pay_periods ORDER BY start_date DESC").fetchall()
+
+    if request.method == "POST":
+        db.execute(
+            """
+            UPDATE container_jobs
+            SET site_id=?, pay_period_id=?, container_ref=?, job_date=?, containers_unloaded=?,
+                notes=?, issue_notes=?, override_rate=?
+            WHERE id=?
+            """,
+            (
+                request.form.get("site_id"),
+                request.form.get("pay_period_id") or None,
+                request.form.get("container_ref", "").strip(),
+                request.form.get("job_date"),
+                int(request.form.get("containers_unloaded", "0")),
+                request.form.get("notes", "").strip(),
+                request.form.get("issue_notes", "").strip(),
+                request.form.get("override_rate") or None,
+                job_id,
+            ),
+        )
+        db.commit()
+        flash("Job updated.", "success")
+        return redirect(url_for("jobs"))
+
+    return render_template("job_edit.html", job=job, sites=sites, pay_periods=pay_periods)
+
+
+@app.route("/jobs/<int:job_id>/decision", methods=["POST"])
+@roles_required("admin", "owner")
+def job_decision(job_id: int):
+    decision = request.form.get("decision", "").lower()
+    if decision not in JOB_STATUSES - {"pending"}:
+        flash("Invalid decision.", "danger")
+        return redirect(url_for("jobs"))
+
+    db = get_db()
+    db.execute(
+        "UPDATE container_jobs SET status=?, reviewed_by=?, review_notes=? WHERE id=?",
+        (
+            decision,
+            current_user()["id"],
+            request.form.get("review_notes", "").strip(),
+            job_id,
+        ),
+    )
+    db.commit()
+    flash(f"Job {decision}.", "success")
+    return redirect(url_for("jobs"))
+
+
+@app.route("/jobs/<int:job_id>/delete", methods=["POST"])
+@roles_required("owner")
+def delete_job(job_id: int):
+    db = get_db()
+    db.execute("DELETE FROM container_jobs WHERE id=?", (job_id,))
+    db.commit()
+    flash("Job deleted.", "success")
+    return redirect(url_for("jobs"))
+
+
+@app.route("/toolbox/new", methods=["GET", "POST"])
+@roles_required("worker", "admin", "owner")
+def new_toolbox():
+    db = get_db()
+    user = current_user()
+    sites = db.execute("SELECT id, name FROM sites WHERE active=1 ORDER BY name").fetchall()
+
+    if request.method == "POST":
+        db.execute(
+            """
+            INSERT INTO toolbox_meetings(worker_id, site_id, meeting_date, topic, details)
+            VALUES (?, ?, ?, ?, ?)
+            """,
+            (
+                user["id"],
+                request.form.get("site_id"),
+                request.form.get("meeting_date"),
+                request.form.get("topic", "").strip(),
+                request.form.get("details", "").strip(),
+            ),
+        )
+        db.commit()
+        flash("Toolbox meeting submitted.", "success")
+        return redirect(url_for("toolbox"))
+
+    return render_template("toolbox_form.html", sites=sites)
+
+
+@app.route("/toolbox")
+@login_required
+def toolbox():
+    db = get_db()
+    user = current_user()
+    params = []
+    where = ""
+    if user["role"] == "worker":
+        where = "WHERE t.worker_id=?"
+        params.append(user["id"])
+
+    rows = db.execute(
+        f"""
+        SELECT t.*, u.username AS worker_username, s.name AS site_name,
+               r.username AS reviewer_username
+        FROM toolbox_meetings t
+        JOIN users u ON u.id=t.worker_id
+        JOIN sites s ON s.id=t.site_id
+        LEFT JOIN users r ON r.id=t.reviewed_by
+        {where}
+        ORDER BY t.created_at DESC
+        """,
+        params,
+    ).fetchall()
+    return render_template("toolbox.html", rows=rows, user=user)
+
+
+@app.route("/toolbox/<int:meeting_id>/decision", methods=["POST"])
+@roles_required("admin", "owner")
+def toolbox_decision(meeting_id: int):
+    decision = request.form.get("decision", "").lower()
+    if decision not in JOB_STATUSES - {"pending"}:
+        flash("Invalid decision.", "danger")
+        return redirect(url_for("toolbox"))
+
+    db = get_db()
+    db.execute(
+        "UPDATE toolbox_meetings SET status=?, reviewed_by=?, review_notes=? WHERE id=?",
+        (
+            decision,
+            current_user()["id"],
+            request.form.get("review_notes", "").strip(),
+            meeting_id,
+        ),
+    )
+    db.commit()
+    flash(f"Toolbox meeting {decision}.", "success")
+    return redirect(url_for("toolbox"))
+
+
+@app.route("/summaries")
+@roles_required("admin", "owner")
+def summaries():
+    db = get_db()
+
+    rates = db.execute(
+        "SELECT rate_per_container FROM rate_tables WHERE active=1 ORDER BY id LIMIT 1"
+    ).fetchone()
+    base_rate = rates["rate_per_container"] if rates else 0
+
+    summary_rows = db.execute(
+        """
+        SELECT u.username, COUNT(j.id) AS total_jobs,
+               SUM(j.containers_unloaded) AS total_containers,
+               SUM(
+                 CASE
+                   WHEN j.status='approved' THEN
+                     j.containers_unloaded * COALESCE(j.override_rate, ?)
+                   ELSE 0
+                 END
+               ) AS estimated_pay
+        FROM users u
+        LEFT JOIN container_jobs j ON j.worker_id=u.id
+        WHERE u.role='worker'
+        GROUP BY u.id
+        ORDER BY u.username
+        """,
+        (base_rate,),
+    ).fetchall()
+
+    by_status = db.execute(
+        "SELECT status, COUNT(*) AS c FROM container_jobs GROUP BY status"
+    ).fetchall()
+
+    return render_template("summaries.html", summary_rows=summary_rows, by_status=by_status)
+
+
+@app.route("/owner/users", methods=["GET", "POST"])
+@roles_required("owner")
+def owner_users():
+    db = get_db()
+    if request.method == "POST":
+        username = request.form.get("username", "").strip()
+        password = request.form.get("password", "")
+        role = request.form.get("role", "worker")
+        if not username or not password or role not in ROLES:
+            flash("Valid username, password, and role are required.", "danger")
+        else:
+            try:
+                db.execute(
+                    "INSERT INTO users(username, password_hash, role) VALUES(?,?,?)",
+                    (username, generate_password_hash(password), role),
+                )
+                new_id = db.execute("SELECT id FROM users WHERE username=?", (username,)).fetchone()["id"]
+                db.execute(
+                    "INSERT INTO staff(user_id, full_name, phone) VALUES(?,?,?)",
+                    (new_id, username, ""),
+                )
+                db.commit()
+                flash("User created.", "success")
+            except sqlite3.IntegrityError:
+                flash("Username already exists.", "danger")
+        return redirect(url_for("owner_users"))
+
+    users = db.execute("SELECT id, username, role, active FROM users ORDER BY id").fetchall()
+    return render_template("owner_users.html", users=users)
+
+
+@app.route("/owner/users/<int:user_id>/toggle", methods=["POST"])
+@roles_required("owner")
+def toggle_user(user_id: int):
+    db = get_db()
+    if user_id == current_user()["id"]:
+        flash("You cannot deactivate your own account.", "danger")
+        return redirect(url_for("owner_users"))
+    db.execute("UPDATE users SET active = CASE active WHEN 1 THEN 0 ELSE 1 END WHERE id=?", (user_id,))
+    db.commit()
+    flash("User status updated.", "success")
+    return redirect(url_for("owner_users"))
+
+
+@app.route("/owner/staff", methods=["GET", "POST"])
+@roles_required("owner")
+def owner_staff():
+    db = get_db()
+    if request.method == "POST":
+        db.execute(
+            "UPDATE staff SET full_name=?, phone=? WHERE id=?",
+            (
+                request.form.get("full_name", "").strip(),
+                request.form.get("phone", "").strip(),
+                request.form.get("staff_id"),
+            ),
+        )
+        db.commit()
+        flash("Staff updated.", "success")
+        return redirect(url_for("owner_staff"))
+
+    staff = db.execute(
+        """
+        SELECT s.id, s.full_name, s.phone, u.username, u.role
+        FROM staff s JOIN users u ON u.id=s.user_id
+        ORDER BY s.id
+        """
+    ).fetchall()
+    return render_template("owner_staff.html", staff=staff)
+
+
+@app.route("/owner/sites", methods=["GET", "POST"])
+@roles_required("owner")
+def owner_sites():
+    db = get_db()
+    if request.method == "POST":
+        db.execute(
+            "INSERT INTO sites(name, address, active) VALUES(?,?,1)",
+            (request.form.get("name", "").strip(), request.form.get("address", "").strip()),
+        )
+        db.commit()
+        flash("Site added.", "success")
+        return redirect(url_for("owner_sites"))
+
+    sites = db.execute("SELECT * FROM sites ORDER BY id DESC").fetchall()
+    return render_template("owner_sites.html", sites=sites)
+
+
+@app.route("/owner/rates", methods=["GET", "POST"])
+@roles_required("owner")
+def owner_rates():
+    db = get_db()
+    if request.method == "POST":
+        db.execute(
+            "INSERT INTO rate_tables(label, rate_per_container, active) VALUES(?,?,1)",
+            (request.form.get("label", "").strip(), float(request.form.get("rate_per_container", "0"))),
+        )
+        db.commit()
+        flash("Rate table added.", "success")
+        return redirect(url_for("owner_rates"))
+
+    rates = db.execute("SELECT * FROM rate_tables ORDER BY id DESC").fetchall()
+    return render_template("owner_rates.html", rates=rates)
+
+
+@app.route("/owner/pay-periods", methods=["GET", "POST"])
+@roles_required("owner")
+def owner_pay_periods():
+    db = get_db()
+    if request.method == "POST":
+        db.execute(
+            "INSERT INTO pay_periods(name, start_date, end_date, is_locked) VALUES(?,?,?,0)",
+            (
+                request.form.get("name", "").strip(),
+                request.form.get("start_date"),
+                request.form.get("end_date"),
+            ),
+        )
+        db.commit()
+        flash("Pay period added.", "success")
+        return redirect(url_for("owner_pay_periods"))
+
+    periods = db.execute("SELECT * FROM pay_periods ORDER BY start_date DESC").fetchall()
+    return render_template("owner_pay_periods.html", periods=periods)
+
+
+@app.route("/owner/pay-periods/<int:period_id>/toggle", methods=["POST"])
+@roles_required("owner")
+def toggle_pay_period(period_id: int):
+    db = get_db()
+    db.execute(
+        "UPDATE pay_periods SET is_locked=CASE is_locked WHEN 1 THEN 0 ELSE 1 END WHERE id=?",
+        (period_id,),
+    )
+    db.commit()
+    flash("Pay period lock updated.", "success")
+    return redirect(url_for("owner_pay_periods"))
+
+
+if __name__ == "__main__":
+    init_db()
+    app.run(debug=True, port=5000)
