# BellTrack

BellTrack is a proof-of-concept system designed to help reduce student lateness at **Bacchus Marsh Grammar (BMG)**.

The system has three main parts:

* **Student Watch** — a web interface that simulates a wearable device.
* **Backend & Database** — stores things like students, bells, classrooms, walk times, attendance and lateness data.
* **Admin Dashboard** — allows staff to manage the system and view attendance data.

The main goal is to make something that is actually clickable and data-driven, rather than just a static mockup. It is still a proof-of-concept, so things like real hardware, GPS and production-level security are outside the scope of the project.

---

## Users

### Student

Students only interact with the Watch side of the system.

There is no proper login system. A student is selected from a seeded list when the app starts, which acts as a basic simulation of pairing the wearable to a student.

### Staff

Staff use the Admin Dashboard.

There is no real authentication for the POC. The landing page simply has an **"I'm Staff"** option that takes the user to the admin side.

### Landing Page

The app starts with two options:

* **I'm a Student**
* **I'm Staff**

These take the user to the relevant part of the system.

---

## Design

The design is based around BMG and the original project mockups.

### Colours

The main colours are:

* **Green** — on-time / good
* **Orange** — getting close / warning
* **Dark blue / navy** — backgrounds and branding

The colours also help show how much time is left before the bell.

### Student Watch

The Watch side is designed to look like a wearable rather than a normal website.

It uses:

* A dark navy background
* Large text
* High contrast
* Bright digital-style numbers
* Minimal UI
* Large buttons that are easy to tap

The important information should be readable quickly without having to look closely at the screen.

Each Watch screen has a header with the current BMG corridor or wing and a digital clock.

### Admin Dashboard

The admin side uses a normal dashboard layout with:

* A sidebar
* Tables
* Forms
* Summary cards
* Configuration sections
* Attendance and error logs

The main sections are:

* Schedule
* Walktime Data
* Class Rewards
* System Settings
* Emergency Broadcast
* Support
* Logout

---

## Student Screens

### Student Picker

A student can select their name from the seeded list.

The selection is saved for the current session and is used when recording attendance.

### Countdown

The main Watch screen shows:

* Time until the next bell
* Current time
* Destination, if selected
* Walking time, if available

The countdown changes colour depending on how much time is left:

* **Green** — plenty of time
* **Orange** — getting close
* **Red** — not enough time or already late

### Destination

A classroom can be selected using a quick-pick button or a short classroom code.

Once a classroom is selected, the system looks up the walking time between the student's current corridor zone and that classroom.

### Walk Time

The Watch shows the walking time alongside the bell countdown.

For example, if there are 45 seconds until the bell but the estimated walk takes 60 seconds, the Watch changes to red to show that the student is running late.

### Tap In

The **"Tap In"** button simulates the student tapping into their classroom.

The tap is sent to the backend and validated there.

The result should appear almost immediately, without a loading spinner.

### Late Reason

If the student taps in after the bell, a reason screen appears.

The default reasons are:

* Locker
* Bathroom
* Held up by Teacher
* Talking with Friends
* Got Lost
* Other

There is no text box. A reason is selected with one tap.

### Streak

The streak screen shows the current class streak and progress towards the next reward.

Example:

**12 DAY STREAK 🔥**

A reward card can show something like:

**Pizza Party Unlock — Next: 15 Days**

If someone is late, the class streak resets.

---

## Admin Screens

### Dashboard

The dashboard gives a quick overview of the system, including:

* Today's attendance
* Current class streaks
* Recent lateness reasons
* Recent tap activity

### Bell Schedule

Staff can add, edit and delete bell times.

Each bell contains information such as:

* Period
* Start time
* End time
* Duration
* Type

### Walktime Matrix

Staff can edit the estimated walking time between corridor zones and classrooms.

Walking times are stored in seconds.

### Rewards & Reasons

Staff can change:

* The streak length needed for a reward
* The available lateness reasons

Lateness reasons are stored in the database rather than being hardcoded into the student interface.

This means adding a new reason in the admin dashboard automatically adds it as an option on the student side.

### Attendance Log

The attendance log shows individual tap records, including:

* Student
* Class
* Timestamp
* On-time / late status
* Lateness reason
* Valid / invalid status

Rejected taps are also saved in the error log.

---

## Countdown & Walk-Time Logic

The countdown is based on the bell schedule stored in the database.

The system finds the next bell and calculates how much time is left using the current time.

If a destination has been selected, the walking time between the current corridor zone and classroom is also retrieved.

The two values are then compared.

### Green

There is comfortably more time left than the estimated walking time.

### Orange

The amount of time left is getting close to the estimated walking time.

### Red

The walking time is longer than the time remaining, or the bell has already passed.

Once a destination is selected, both the bell countdown and walking time are shown on the Watch.

---

## Tap Validation

Tap validation happens on the backend.

The basic process is:

```text
ValidateTap(studentID, timestamp)

1. Check that the student exists.
   → If not, reject as "Unregistered ID".

2. Check if the student has already tapped in
   for the current class session.
   → If yes, reject as "Duplicate tap".

3. Check if there is a scheduled class
   matching the timestamp.
   → If not, reject as "No matching class".

4. If everything is valid:
   → Record the tap.
   → Mark it as late if it is after the bell.
   → Otherwise mark it as on-time.
   → Update the class streak.
```

Rejected taps are still saved to the error log.

On the Watch, errors are shown using a simple message such as:

> Couldn't log that tap — please see a teacher.

Raw backend errors should never be shown to students.

---

## Streak System

Each class has a current streak.

The streak starts at zero and can never go below zero.

At the end of a class session:

* If every student was on-time, the streak increases by 1.
* If any student was late, the streak resets to 0.

When the streak reaches the reward threshold set by staff, the reward is unlocked.

The student sees this on the streak screen and the admin dashboard also shows that the reward has been reached.

---

## Database

The project uses **Supabase** for the database and persistent data.

The main tables are:

| Table                | Purpose                                   |
| -------------------- | ----------------------------------------- |
| `students`           | Stores student information                |
| `classrooms`         | Stores classroom and corridor information |
| `bell_schedule`      | Stores bell times                         |
| `walktimes`          | Stores walking times                      |
| `class_sessions`     | Stores class sessions and streaks         |
| `attendance_records` | Stores student tap and attendance data    |
| `lateness_reasons`   | Links attendance records to reasons       |
| `reason_categories`  | Stores the available lateness reasons     |
| `reward_config`      | Stores the reward threshold               |
| `error_log`          | Stores rejected taps and errors           |

The database should contain realistic fake data, including:

* Around 15–20 students
* Around 6 classrooms
* A full day's bell schedule
* Several corridor zones
* Walking times between locations
* The default lateness reasons

Field names and types should stay reasonably close to the original data dictionary. For example, student IDs should be six-digit text values and walking times should be stored as integers.

---

## Out of Scope

The following are not part of this POC:

* Real wearable hardware
* Hardware-specific code
* Real offline mode
* Background sync
* GPS or indoor positioning
* Integration with school timetable systems
* Schoolbox or parent-app integration
* Disciplinary or punishment systems
* Predictive analytics
* AI behaviour modelling
* A native mobile app
* Production-level authentication and security

The corridor location is manually selected and authentication is kept simple.

The system is designed to **reward and record**, not punish.

---

## What "Done" Looks Like

The main demo flow should work like this:

1. Open BellTrack.
2. Select **I'm a Student**.
3. Choose a student.
4. See the live countdown.
5. Choose a destination classroom.
6. See the walking time alongside the countdown.
7. Tap **Tap In**.
8. If late, select a reason.
9. See the class streak update.
10. Switch to **I'm Staff**.
11. See the attendance record in the admin dashboard.
12. See rejected taps in the error log.
13. Change something in the admin dashboard.
14. Return to the student side and see the change.

For example, adding a new lateness reason should make that reason appear on the student side. Changing a bell time should also change the countdown.

The most important part of the project is:

**Student action → Database → Admin Dashboard → Admin Changes → Student Interface**

Getting this full loop working properly is more important than adding extra features or polishing the UI.

---

## Tech Stack

* **Frontend:** Web application
* **Backend / Database:** Supabase
* **UI:** Responsive web interface
* **Development:** Lovable

This project was built using Lovable.

[Lovable](https://lovable.dev?utm_source=chatgpt.com)

---

## Development

Node.js and npm are required to run the project locally.

```bash
git clone <this-repository-url>
cd <repository-name>
npm install
npm run dev
```

The project can also be continued through the Lovable editor.

[Lovable Project Editor](https://lovable.dev/projects/27d41f41-4682-45c5-8d69-5067f3132721?utm_source=chatgpt.com)

---

## Project Status

**Proof of Concept**

BellTrack is currently focused on demonstrating the main idea and the complete student → database → admin workflow.

It is not intended to be used as a real school system yet.
