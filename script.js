/* 
Write JavaScript code to check if a DBppacad.db database exists, if not the 
database should be created. 
The database should have a tables
 1. 'users' with the following columns:
- idUser (integer, primary key, autoincrement)
- first_name (text, not null)
- last_name (text, not null)
- username (text, unique, not null)
- password (text, not null)
- email (text, unique, not null)
- phone (text, not null)
- user_role (text, not null, default 'student')
- status (text, not null, default 'active')
- grade_level (integer, not null)
- created_at (timestamp, not null, default current timestamp)

2. 'logs' with the following columns:
- idLog (integer, primary key, autoincrement)
- idUser (integer, foreign key referencing users.idUser)
- action (text, not null)
- timestamp (timestamp, default current timestamp)

3. 'subject' with the following columns:
- idSubject (integer, primary key, autoincrement)
- subject_name (text, not null)
- description (text)
- created_at (timestamp, default current timestamp)

4. 'grade' with the following columns:
- idGrade (integer, primary key, autoincrement)
- grade_level (integer, not null)
- description (text)
- created_at (timestamp, default current timestamp)

5. 'lessons' with the following columns:
- idLesson (integer, primary key, autoincrement)
- idSubject (integer, foreign key referencing subject.idSubject)
- lesson_title (text, not null)
- lesson_content (text, not null)
- grade_level (integer, not null)
- created_at (timestamp, default current timestamp)
- updated_at (timestamp, default current timestamp)
- uploaded_by (integer, foreign key referencing users.idUser)
- url (text, not null)

6. 'assessments' with the following columns:
- idAssessment (integer, primary key, autoincrement)
- idLesson (integer, foreign key referencing lessons.idLesson)
- assessment_title (text, not null)
- total_marks (integer, not null)
- pass_marks (integer, not null)
- created_at (timestamp, default current timestamp)
- updated_at (timestamp, default current timestamp)
- uploaded_by (integer, foreign key referencing users.idUser)
- url (text, not null)

7. 'results' with the following columns:
- idResult (integer, primary key, autoincrement)
- idAssessment (integer, foreign key referencing assessments.idAssessment)
- idUser (integer, foreign key referencing users.idUser)
- marks_obtained (integer, not null)
- status (text, not null)
- taken_at (timestamp, default current timestamp)

8. 'questions' with the following columns:
- idQuestion (integer, primary key, autoincrement)
- idAssessment (integer, foreign key referencing assessments.idAssessment)
- question_text (text, not null)
- question_type (text, not null)
- options (text)
- correct_answer (text, not null)
- marks (integer, not null)

9. 'responses' with the following columns:
- idResponse (integer, primary key, autoincrement)
- idQuestion (integer, foreign key referencing questions.idQuestion)
- idUser (integer, foreign key referencing users.idUser)
- given_answer (text, not null)
- is_correct (boolean, not null)
- answered_at (timestamp, default current timestamp)

10. 'feedback' with the following columns:
- idFeedback (integer, primary key, autoincrement)
- idUser (integer, foreign key referencing users.idUser)
- feedback_text (text, not null)
- submitted_at (timestamp, default current timestamp)

11. 'notifications' with the following columns:
- idNotification (integer, primary key, autoincrement)
- idUser (integer, foreign key referencing users.idUser)
- notification_text (text, not null)
- is_read (boolean, not null, default false)
- created_at (timestamp, default current timestamp)

12. 'settings' with the following columns:
- idSetting (integer, primary key, autoincrement)
- setting_key (text, unique, not null)
- setting_value (text, not null)
- updated_at (timestamp, default current timestamp)

13. 'sessions' with the following columns:
- idSession (integer, primary key, autoincrement)
- idUser (integer, foreign key referencing users.idUser)
- session_token (text, unique, not null)
- created_at (timestamp, default current timestamp)
- expires_at (timestamp, not null)

14. 'achievements' with the following columns:
- idAchievement (integer, primary key, autoincrement)
- idUser (integer, foreign key referencing users.idUser)
- achievement_title (text, not null)
- achievement_description (text)
- awarded_at (timestamp, default current timestamp)

15. 'badges' with the following columns:
- idBadge (integer, primary key, autoincrement)
- badge_name (text, not null)
- badge_description (text)
- created_at (timestamp, default current timestamp)

16. 'user_badges' with the following columns:
- idUserBadge (integer, primary key, autoincrement)
- idUser (integer, foreign key referencing users.idUser)
- idBadge (integer, foreign key referencing badges.idBadge)
- awarded_at (timestamp, default current timestamp)

17. 'course_progress' with the following columns:
- idProgress (integer, primary key, autoincrement)
- idUser (integer, foreign key referencing users.idUser)
- idLesson (integer, foreign key referencing lessons.idLesson)
- progress_percentage (real, not null)
- last_accessed_at (timestamp, default current timestamp)

18. 'instructors' with the following columns:
- idInstructor (integer, primary key, autoincrement)
- first_name (text, not null)
- last_name (text, not null)
- email (text, unique, not null)
- phone (text)
- created_at (timestamp, default current timestamp)

19. 'user_instructors' with the following columns:
- idUserInstructor (integer, primary key, autoincrement)
- idUser (integer, foreign key referencing users.idUser)
- idInstructor (integer, foreign key referencing instructors.idInstructor)
- assigned_at (timestamp, default current timestamp)

20. 'certificates' with the following columns:
- idCertificate (integer, primary key, autoincrement)
- idUser (integer, foreign key referencing users.idUser)
- certificate_title (text, not null)
- issued_at (timestamp, default current timestamp)
- url (text, not null)

21. 'payments' with the following columns:
- idPayment (integer, primary key, autoincrement)
- idUser (integer, foreign key referencing users.idUser)
- amount (real, not null)
- payment_date (timestamp, default current timestamp)
- payment_method (text, not null)
- status (text, not null)

22. 'subscriptions' with the following columns:
- idSubscription (integer, primary key, autoincrement)
- idUser (integer, foreign key referencing users.idUser)
- subscription_type (text, not null)
- start_date (timestamp, default current timestamp)
- end_date (timestamp, not null)
- status (text, not null)

23. 'coupons' with the following columns:
- idCoupon (integer, primary key, autoincrement)
- coupon_code (text, unique, not null)
- discount_percentage (real, not null)
- valid_from (timestamp, not null)
- valid_to (timestamp, not null)
- usage_limit (integer)
- created_at (timestamp, default current timestamp)

24. 'coupon_usage' with the following columns:
- idCouponUsage (integer, primary key, autoincrement)
- idCoupon (integer, foreign key referencing coupons.idCoupon)
- idUser (integer, foreign key referencing users.idUser)
- used_at (timestamp, default current timestamp)

25. 'audit_logs' with the following columns:
- idAuditLog (integer, primary key, autoincrement)
- idUser (integer, foreign key referencing users.idUser)
- action (text, not null)
- details (text)
- timestamp (timestamp, default current timestamp)

26. 'messages' with the following columns:
- idMessage (integer, primary key, autoincrement)
- sender_id (integer, foreign key referencing users.idUser)
- receiver_id (integer, foreign key referencing users.idUser)
- message_text (text, not null)
- sent_at (timestamp, default current timestamp)
- is_read (boolean, not null, default false)

27. 'forums' with the following columns:
- idForum (integer, primary key, autoincrement)
- forum_name (text, not null)
- description (text)
- created_at (timestamp, default current timestamp)
- updated_at (timestamp, default current timestamp)

28. 'forum_posts' with the following columns:
- idPost (integer, primary key, autoincrement)
- idForum (integer, foreign key referencing forums.idForum)
- idUser (integer, foreign key referencing users.idUser)
- post_content (text, not null)
- created_at (timestamp, default current timestamp)
- updated_at (timestamp, default current timestamp)

29. 'forum_comments' with the following columns:
- idComment (integer, primary key, autoincrement)
- idPost (integer, foreign key referencing forum_posts.idPost)
- idUser (integer, foreign key referencing users.idUser)
- comment_content (text, not null)
- created_at (timestamp, default current timestamp)
- updated_at (timestamp, default current timestamp)

30. 'tags' with the following columns:
- idTag (integer, primary key, autoincrement)
- tag_name (text, unique, not null)
- created_at (timestamp, default current timestamp)
- updated_at (timestamp, default current timestamp)

31. 'lesson_tags' with the following columns:
- idLessonTag (integer, primary key, autoincrement)
- idLesson (integer, foreign key referencing lessons.idLesson)
- idTag (integer, foreign key referencing tags.idTag)
- tagged_at (timestamp, default current timestamp)

32. 'notifications_settings' with the following columns:
- idNotificationSetting (integer, primary key, autoincrement)
- idUser (integer, foreign key referencing users.idUser)
- email_notifications (boolean, not null, default true)
- sms_notifications (boolean, not null, default false)
- push_notifications (boolean, not null, default true)
- updated_at (timestamp, default current timestamp)

33. 'activity_logs' with the following columns:
- idActivityLog (integer, primary key, autoincrement)
- idUser (integer, foreign key referencing users.idUser)
- activity_type (text, not null)
- activity_details (text)
- activity_time (timestamp, default current timestamp)


The database should be created using SQLite 3.

Use appropriate error handling to manage any issues that arise during
the database creation process.
(function() {
    'use strict';
    // Your code here
    const dbName = 'DBppacad.db';
    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = function(event) { 
        const db = event.target.result;
        if (!db.objectStoreNames.contains('users')) {
            const userStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
            userStore.createIndex('username', 'username', { unique: true });    
            userStore.createIndex('email', 'email', { unique: true });
            userStore.createIndex('created_at', 'created_at', { unique: false });
        }
    };

    request.onsuccess = function(event) {
        const db = event.target.result;
        console.log('Database initialized successfully:', dbName);
        db.close();
    };
    request.onerror = function(event) {
        console.error('Database error:', event.target.errorCode);
    };
})();   


*/