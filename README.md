# College_gradingDB
A finals college submission for datama2, making of the full stack system

# 🏇 Tracen Academy: Race Eligibility & Grading System

A specialized "System of Record" designed for **Tracen Academy**. This platform allows faculty members to record trainee performance and automatically determines race tier eligibility (G1, G2, G3, or OP) based on real-time academic standings.

🌐 **[Visit the Live Dashboard](https://college-grading-db.vercel.app/)**

---

## 📖 Project Overview
This system bridges the gap between classroom performance and the racetrack. Faculty members input grades, and the system utilizes a **Database View** to derive qualifications without manual calculation.

### **Core Business Rules**
* **Grading Scale:** 1.00 (Minimum) to 5.00 (Maximum).
* **Automated Eligibility Logic:**
    * **G1 (Elite):** Grade 4.00 – 5.00
    * **G2:** Grade 3.50 – 3.99
    * **G3:** Grade 3.00 – 3.49
    * **OP (Open):** Grade 1.00 – 2.99
* **Faculty Scope:** Professors are restricted to managing grades only for students within their assigned sections via Row Level Security (RLS).

---

## 🛠️ Tech Stack
* **Database:** Supabase (PostgreSQL)
* **Logic:** SQL Derived Views
* **Authentication:** Supabase Auth 
* **Security:** PostgreSQL Row Level Security (RLS)

---

## 🔐 Demo Accounts
The following accounts are configured for testing the Tracen Academy environment:

| Role | Name | Email | Password | Linked Slot |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Registrar | `registraruma@apc.edu.ph` | `APC_Reg#2026!` | N/A |
| **Faculty** | Tazuna | `t.hayakawa@apc.edu.ph` | `Uma_Tazu@99` | FAC01 |
| **Faculty** | Yayoi | `y.akikawa@apc.edu.ph` | `Yayoi_Ak!88` | FAC02 |
| **Faculty** | Etsumi | `e.otone@apc.edu.ph` | `Otone_Et$77` | FAC03 |
| **Faculty** | Riko | `r.kashi@apc.edu.ph` | `Riko_Kas%66` | FAC04 |

---

## 📊 Database Specification
| Table | Description |
| :--- | :--- |
| **`Student`** | Master list of all trainees (e.g., Special Week, Silence Suzuka). |
| **`FacultyMember`** | Academic staff linked to their authentication profiles. |
| **`GradeRecord`** | Stores the numeric performance scores (1.00 - 5.00). |
| **`student_race_eligibility`** | A **Virtual View** that dynamically maps grades to race tiers. |

---

## 🚀 Getting Started
1. **Initialize Database:** Run the SQL Master Setup in your Supabase SQL Editor.
2. **Environment Variables:** Configure your `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
3. **Run Application:** Use `npm install` followed by `npm run dev`.

---
*Developed for Tracen Academy Trainee Management.*
