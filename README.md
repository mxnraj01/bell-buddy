# Bell Buddy

0. What you're building

BellTrack is a student-lateness proof-of-concept for Bacchus Marsh Grammar. It has three connected parts that must feel like one system, not three separate apps:

Watch/Display simulation — a full-screen web view standing in for a wearable device, worn by "a student." Shows a live countdown to the next bell, a walk-time estimate to a chosen classroom, and a one-tap "why were you late" prompt.

Backend + database — stores the bell schedule, walktimes between locations, students, attendance/lateness records, reason codes, and class on-time streaks. Real persistence (use Supabase, not local-only state) so the demo actually proves data survives a refresh — but this is a proof-of-concept, not a production system. Don't build offline caching, background sync, or auth hardening.

Admin dashboard — a normal desktop-style web dashboard for staff to edit the bell schedule, walktime matrix, reward thresholds, and reason categories, and to view live attendance/streak data.

Goal bar: more convincing than a static mockup, not production-ready. It should be genuinely clickable and data-driven — real inserts, real reads, real validation logic — but doesn't need offline robustness, real indoor positioning, real hardware, or auth security beyond a simple role toggle (Student view / Admin view).

1. Users

Student — interacts only with the Watch/Display screens. No login needed; simulate "logged in as [Student Name]" via a simple picker on first load (stand-in for wearable pairing).

Admin/Teacher — interacts only with the Admin Dashboard. Simple role switch (no real auth) to get there — e.g. a "Staff Login" button that just asks for a name, no password required for the POC.

Add a simple landing screen with two buttons: "I'm a Student" and "I'm Staff", routing to the two halves of the app.

2. Visual identity

Pull this directly from the existing design docs — keep it consistent across every screen:

Primary colors: green, orange, dark blue (use green = on-time/good, orange = getting close/warning, dark blue = structural/background/branding — this maps naturally onto the countdown urgency system in section 4).

One consistent font family across the whole app (student and admin sides both).

Watch/Display screens should look like a wearable face: large, bold, high-contrast, minimal chrome, dark background with bright text — legible "from 5 metres away" is the design brief, so oversized type, no small print, no dense layouts.

Admin Dashboard should look like a normal SaaS dashboard: sidebar or top nav, tables, forms, cards — standard Lovable/shadcn dashboard conventions are fine here.
UI reference (from mockups) — add to section 2:

Header bar (every watch screen): small clock/location icon + corridor label on the left (e.g. "BMG — Science Wing"), a large digital clock top-right in bright mint/neon green, monospace-style digits.

Background: near-black navy across all watch screens, white/light-grey body text, orange used for the "hero" number (countdown, streak digits) and for alert states.

Destination input screen: big centered heading ("Where are you headed?"), a dashed placeholder box that fills in as digits are entered, a numeric keypad (0–9 + backspace) plus quick-pick classroom shortcut buttons above it (e.g. "A101," "B204" with a subtitle tag), and a disabled/greyed "Confirm Destination →" button that activates once input is valid.

Reason capture screen: heading ("Why are you late?"), a 3×2 grid of large tappable cards, each with an icon + label (Locker / Bathroom / Held up by Teacher / Talking with Friends / Got Lost / Other) — no text entry anywhere.

Main countdown screen: "Next Bell in…" label, huge bordered countdown box in orange, a one-line walk-time hint underneath, and a full-width blue "Tap to Enter Next Class →" button.

Error/offline state: same layout family but with a status pill at the top (e.g. orange "Offline Mode Active" banner, or a red "Unregistered ID Tap" card with a short explanation and Try Again / Get Help buttons) — errors reuse the same visual language, they don't look like a broken screen.

Streak screen: "ON-TIME STREAK" label, large green streak number ("12 Days"), a reward progress card with a labeled progress bar (e.g. "Pizza Party Unlock — Next: 15 Days"), and a red warning strip ("STREAK RESETS IF ANYONE IS LATE!").

Admin dashboard: left sidebar nav (Schedule / Walktime Data / Class Rewards / System Settings, Emergency Broadcast + Support/Logout pinned at the bottom), top bar with search + sync status ("System Synchronized," last sync time), a Bell Schedule Editor table (period/start/end/duration/type with inline edit), and side panels for Reward Thresholds and Lateness Reasons, plus a Walktime Mapping data section below.

Branding note: rename everything — corridor header, admin portal title, footer text — to BMG (Bacchus Marsh Grammar). Replace "West High Corridor" → "BMG Corridor" (or the specific wing, e.g. "BMG — Science Wing") and "ChronosLink Admin" → "BellTrack Admin — BMG."


3. Screens to build

Build all of these as real, navigable routes — this maps to the storyboard pages already designed for this project:

Student / Watch side

Student picker (mock pairing) — pick a student from a seeded list to "wear" the watch as. Stores selection in session state.

Timer / Countdown page (main watch face) — the default screen. Shows:

Live countdown to the next scheduled bell (large, central).

Color-coded urgency: green (plenty of time), amber/orange (cutting it close), red (late or about to be).

A button/tile to go pick a destination classroom.

Location/classroom code input page — student selects (or types a short code for) the classroom they're heading to. On selection, look up the walktime between "current corridor location" (simulate 4–6 named corridor zones, e.g. "Science Wing," "Gym Corridor," "Library Corridor") and the chosen classroom.

Walktime + combined countdown view — after a classroom is chosen, the main watch face updates to show both the bell countdown and the walk-time estimate together, color-coded the same way (e.g. red if walk-time > time remaining).

ID Tap / secondary countdown page — simulates tapping into a classroom (a big "Tap In" button). On tap, run the validation logic in section 5 and show a confirmation flash (must feel like it resolves in under a second — no loading spinners).

Late reason capture page — appears automatically only if the tap was after the bell time. One-tap, no typing: buttons for Locker / Bathroom / Held up by teacher / Talking with friends / Got lost / Other. Must be selectable in a single tap, large touch targets, no scrolling required.

Streak page — shows the current class's on-time streak (e.g. "12 DAY STREAK 🔥"), and whether a reward threshold has just been hit.

Admin side

Admin dashboard home — overview cards: today's attendance summary, active streaks across classes, recent lateness reasons breakdown (simple chart is fine).

Bell schedule editor — table/form to add, edit, delete bell times.

Walktime matrix editor — editable grid/table of walk-time-in-seconds between corridor locations and classrooms (matches the data dictionary: 0–60+ range, per-room, admin-editable).

Reward threshold & reason category config — lets admin change what streak length triggers a reward, and edit/add/remove the list of lateness reason categories (these must not be hardcoded elsewhere in the app — the student-side reason buttons should read from this config).

Attendance / lateness log viewer — filterable table of raw tap records (student, class, timestamp, on-time/late, reason, valid/error flag) — this is the "error log for review" the design doc calls for.

4. Countdown & walk-time logic (Section 3 IPO from the design doc)

Pull the next bell time from the bell schedule table and compute a live countdown against current system time.

If the student has chosen a destination classroom, pull the walktime (seconds) between their current corridor zone and that classroom from the walktime matrix.

Compute urgency and color-code:

Green — time remaining until bell is comfortably more than the walk-time needed.

Amber — time remaining is close to (roughly within touching distance of) the walk-time needed.

Red — time remaining is less than the walk-time needed, or the bell has already gone.

Render both numbers (bell countdown + walk estimate) together on the main watch face once a destination is picked.

5. Tap validation logic (Section 7 pseudocode from the design doc)

Implement this exactly as the source design's algorithm, translated into your backend logic (edge function / server logic, not just client-side):

ValidateTap(studentID, timestamp):
  if studentID not in enrolment table -> reject as "Unregistered ID"
  if studentID already has a valid tap for this class session -> reject as "Duplicate tap"
  if there is no scheduled class matching this timestamp -> reject as "No matching class"

  otherwise:
    record a valid tap
    if timestamp is after the class's BellTime -> mark as late, prompt for a reason (screen 6)
    else -> mark as on-time
    run UpdateStreak() for that class (section 6 below)

Rejected taps should still write to an error log (visible in the admin log viewer, screen 12) rather than silently failing or crashing — this satisfies the "graceful handling of invalid input" non-functional requirement. On the watch side, a rejected tap should show a short, calm error state (e.g. "Couldn't log that tap — see a teacher"), never a raw error or crash.

6. Streak logic (Section 5 IPO from the design doc)

Each class session tracks a ClassStreak integer (must never go negative).

When a class session ends (or as taps come in), check every student's on-time/late status for that session:

If all students were on-time → increment the streak by 1.

If any student was late → reset the streak to 0.

When the streak reaches the admin-configured reward threshold, trigger a reward-unlock state: show a visible notification/animation on the streak page and flag it in the admin dashboard overview.

7. Data model (seed with realistic fake data, ~15–20 students, ~6 classrooms, a full day's bell schedule)

TableKey fieldsstudentsstudent_id (6-digit text), nameclassroomsclassroom_id, name, corridor_zonebell_schedulebell_time, period_labelwalktimesfrom_zone, to_classroom_id, walk_time_seconds (0–60+, admin-editable)class_sessionssession_id, classroom_id, bell_time, current_streakattendance_recordsstudent_id, session_id, timestamp, status (on-time/late), valid (bool)lateness_reasonsrecord_id → attendance_records, reason_codereason_categoriesreason_code, label (admin-editable list; seed with Locker / Bathroom / Held up by teacher / Talking with friends / Got lost / Other)reward_configstreak_threshold (admin-editable)error_logtimestamp, student_id_attempted, error_type, raw_input

Keep field names/types close to the original data dictionary (e.g. StudentID as 6-digit text, timestamps as full datetime, WalkTimeSec as an integer) so the demo still visibly traces back to the design doc.

8. Explicitly out of scope — do not build these

Any real wearable hardware or hardware-specific code.

Real offline mode / background sync when WiFi drops (the design doc calls for this long-term, but it is not part of this POC).

Real indoor positioning / GPS — corridor location is just a manually selected dropdown.

Integration with real school systems (timetable software, Schoolbox, parent apps).

Any disciplinary/penalty automation — this system only rewards and logs, never punishes.

Predictive analytics or AI behaviour modelling.

A real mobile phone app — everything is the watch-simulation web view plus the admin dashboard.

Real authentication/security — a name-only "login" is enough for both roles.

9. What "done" looks like for this demo

Someone should be able to:

Land on the app, pick "I'm a Student," choose a seeded student, land on the watch face and see a live countdown.

Pick a destination classroom and see the walk-time + countdown combine, color-coded.

Tap "Tap In" — if late, get prompted for a one-tap reason, then see a streak update (or reset) reflected on the streak page.

Try tapping in twice, or with an unregistered/edge-case ID, and see it gracefully rejected (not crash), and see that rejection show up in the admin error log.

Switch to "I'm Staff," land on the admin dashboard, see the tap that just happened reflected in the attendance log and overview cards.

Edit the bell schedule, walktime matrix, reward threshold, or reason categories in the admin dashboard, then go back to the student side and see those changes actually take effect (e.g. a new reason category appears as a tap-able option; a changed bell time changes the countdown).

That end-to-end loop — student action → real database write → admin dashboard reflects it → admin config change → student side reflects it — is the single most important thing to get working. Prioritize that over polish anywhere else.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/27d41f41-4682-45c5-8d69-5067f3132721).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
