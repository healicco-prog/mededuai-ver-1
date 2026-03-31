export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_attendance_records: {
        Row: {
          course_id: string
          created_at: string
          date: string
          faculty: string | null
          id: string
          student_attendance: Json
          time_from: string
          time_to: string
          topic: string
        }
        Insert: {
          course_id: string
          created_at?: string
          date: string
          faculty?: string | null
          id?: string
          student_attendance?: Json
          time_from: string
          time_to: string
          topic: string
        }
        Update: {
          course_id?: string
          created_at?: string
          date?: string
          faculty?: string | null
          id?: string
          student_attendance?: Json
          time_from?: string
          time_to?: string
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_attendance_records_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "timetable_formats"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_logs: {
        Row: {
          created_at: string | null
          id: string
          module: string
          prompt: string | null
          response: string | null
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          module: string
          prompt?: string | null
          response?: string | null
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          module?: string
          prompt?: string | null
          response?: string | null
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_papers: {
        Row: {
          assessment_id: string | null
          id: string
          max_marks: number
          mode: Database["public"]["Enums"]["dh_assessment_mode"]
          paper_name: string
        }
        Insert: {
          assessment_id?: string | null
          id?: string
          max_marks: number
          mode: Database["public"]["Enums"]["dh_assessment_mode"]
          paper_name: string
        }
        Update: {
          assessment_id?: string | null
          id?: string
          max_marks?: number
          mode?: Database["public"]["Enums"]["dh_assessment_mode"]
          paper_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_papers_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "department_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          correct_answer: string | null
          created_at: string | null
          id: string
          marks: number
          options: Json | null
          question_text: string
          question_type: string | null
          topic_id: string | null
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string | null
          id?: string
          marks: number
          options?: Json | null
          question_text: string
          question_type?: string | null
          topic_id?: string | null
        }
        Update: {
          correct_answer?: string | null
          created_at?: string | null
          id?: string
          marks?: number
          options?: Json | null
          question_text?: string
          question_type?: string | null
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          course_id: string | null
          created_at: string | null
          date: string
          id: string
          status: string | null
          student_id: string | null
          teacher_id: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          status?: string | null
          student_id?: string | null
          teacher_id?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          status?: string | null
          student_id?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      blogs: {
        Row: {
          author_bio: string | null
          author_id: string | null
          author_image: string | null
          author_name: string | null
          author_role: string | null
          category: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          faq_section: Json | null
          featured_image: string | null
          id: string
          meta_title: string | null
          primary_keyword: string | null
          reading_time: number | null
          secondary_keywords: string | null
          slug: string
          status: string | null
          tags: string | null
          title: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          author_bio?: string | null
          author_id?: string | null
          author_image?: string | null
          author_name?: string | null
          author_role?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          faq_section?: Json | null
          featured_image?: string | null
          id?: string
          meta_title?: string | null
          primary_keyword?: string | null
          reading_time?: number | null
          secondary_keywords?: string | null
          slug: string
          status?: string | null
          tags?: string | null
          title: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          author_bio?: string | null
          author_id?: string | null
          author_image?: string | null
          author_name?: string | null
          author_role?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          faq_section?: Json | null
          featured_image?: string | null
          id?: string
          meta_title?: string | null
          primary_keyword?: string | null
          reading_time?: number | null
          secondary_keywords?: string | null
          slug?: string
          status?: string | null
          tags?: string | null
          title?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string | null
          file_url: string | null
          group_id: string | null
          id: string
          message: string
          sender_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_url?: string | null
          group_id?: string | null
          id?: string
          message: string
          sender_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_url?: string | null
          group_id?: string | null
          id?: string
          message?: string
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "mentorship_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      department_assessments: {
        Row: {
          created_at: string | null
          created_by: string | null
          date: string
          department_id: string | null
          id: string
          name: string
          total_classes_conducted: number | null
          type: Database["public"]["Enums"]["dh_assessment_type"]
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date: string
          department_id?: string | null
          id?: string
          name: string
          total_classes_conducted?: number | null
          type: Database["public"]["Enums"]["dh_assessment_type"]
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date?: string
          department_id?: string | null
          id?: string
          name?: string
          total_classes_conducted?: number | null
          type?: Database["public"]["Enums"]["dh_assessment_type"]
        }
        Relationships: [
          {
            foreignKeyName: "department_assessments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_assessments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string | null
          head_id: string | null
          id: string
          institution_id: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          head_id?: string | null
          id?: string
          institution_id?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          head_id?: string | null
          id?: string
          institution_id?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_head_id_fkey"
            columns: ["head_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      elective_shared_store: {
        Row: {
          allotment_method: string | null
          allotments: Json | null
          codes: Json | null
          dates: Json | null
          electives: Json | null
          id: string
          institutions: Json | null
          logbook_approvals: Json | null
          preferences: Json | null
          sessions: Json | null
          students: Json | null
          updated_at: string | null
        }
        Insert: {
          allotment_method?: string | null
          allotments?: Json | null
          codes?: Json | null
          dates?: Json | null
          electives?: Json | null
          id?: string
          institutions?: Json | null
          logbook_approvals?: Json | null
          preferences?: Json | null
          sessions?: Json | null
          students?: Json | null
          updated_at?: string | null
        }
        Update: {
          allotment_method?: string | null
          allotments?: Json | null
          codes?: Json | null
          dates?: Json | null
          electives?: Json | null
          id?: string
          institutions?: Json | null
          logbook_approvals?: Json | null
          preferences?: Json | null
          sessions?: Json | null
          students?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      exam_questions: {
        Row: {
          ai_rubric: Json | null
          exam_id: string | null
          id: string
          is_rubric_approved: boolean | null
          marks: number
          question_number: number
          question_text: string
          question_type: string | null
        }
        Insert: {
          ai_rubric?: Json | null
          exam_id?: string | null
          id?: string
          is_rubric_approved?: boolean | null
          marks: number
          question_number: number
          question_text: string
          question_type?: string | null
        }
        Update: {
          ai_rubric?: Json | null
          exam_id?: string | null
          id?: string
          is_rubric_approved?: boolean | null
          marks?: number
          question_number?: number
          question_text?: string
          question_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "examinations"
            referencedColumns: ["id"]
          },
        ]
      }
      examinations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          teacher_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          teacher_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "examinations_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          course: string | null
          created_at: string | null
          head_id: string | null
          id: string
          logo_url: string | null
          name: string
        }
        Insert: {
          course?: string | null
          created_at?: string | null
          head_id?: string | null
          id?: string
          logo_url?: string | null
          name: string
        }
        Update: {
          course?: string | null
          created_at?: string | null
          head_id?: string | null
          id?: string
          logo_url?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "institutions_head_id_fkey"
            columns: ["head_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_content: {
        Row: {
          detailed_notes: string | null
          flashcards: Json | null
          id: string
          introduction: string | null
          last_generated_at: string | null
          ppt_content: Json | null
          summary: string | null
          topic_id: string | null
        }
        Insert: {
          detailed_notes?: string | null
          flashcards?: Json | null
          id?: string
          introduction?: string | null
          last_generated_at?: string | null
          ppt_content?: Json | null
          summary?: string | null
          topic_id?: string | null
        }
        Update: {
          detailed_notes?: string | null
          flashcards?: Json | null
          id?: string
          introduction?: string | null
          last_generated_at?: string | null
          ppt_content?: Json | null
          summary?: string | null
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lms_content_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorship_feedback: {
        Row: {
          academic_guidance_rating: number | null
          comments: string | null
          id: string
          meeting_id: string | null
          mentor_support_rating: number | null
          personal_support_rating: number | null
          student_id: string | null
          submitted_at: string | null
          usefulness_rating: number | null
        }
        Insert: {
          academic_guidance_rating?: number | null
          comments?: string | null
          id?: string
          meeting_id?: string | null
          mentor_support_rating?: number | null
          personal_support_rating?: number | null
          student_id?: string | null
          submitted_at?: string | null
          usefulness_rating?: number | null
        }
        Update: {
          academic_guidance_rating?: number | null
          comments?: string | null
          id?: string
          meeting_id?: string | null
          mentor_support_rating?: number | null
          personal_support_rating?: number | null
          student_id?: string | null
          submitted_at?: string | null
          usefulness_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_feedback_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "mentorship_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorship_feedback_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorship_group_members: {
        Row: {
          assigned_at: string | null
          group_id: string | null
          id: string
          student_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          group_id?: string | null
          id?: string
          student_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          group_id?: string | null
          id?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "mentorship_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorship_group_members_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorship_groups: {
        Row: {
          created_at: string | null
          department_id: string | null
          id: string
          institution_id: string | null
          mentor_id: string | null
          name: string | null
          peer_mentor_id: string | null
          year: number | null
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          id?: string
          institution_id?: string | null
          mentor_id?: string | null
          name?: string | null
          peer_mentor_id?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          id?: string
          institution_id?: string | null
          mentor_id?: string | null
          name?: string | null
          peer_mentor_id?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_groups_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorship_groups_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorship_groups_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorship_groups_peer_mentor_id_fkey"
            columns: ["peer_mentor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorship_meetings: {
        Row: {
          academic_nonacademic:
            | Database["public"]["Enums"]["meeting_focus"]
            | null
          action_taken: string | null
          created_at: string | null
          date: string
          discussion_points: string | null
          goal_setting: string | null
          group_id: string | null
          id: string
          issues_raised: string | null
          mentor_id: string | null
          next_meeting_date: string | null
          remarks: string | null
          signed_by_mentor: boolean | null
          type: Database["public"]["Enums"]["meeting_type"] | null
        }
        Insert: {
          academic_nonacademic?:
            | Database["public"]["Enums"]["meeting_focus"]
            | null
          action_taken?: string | null
          created_at?: string | null
          date: string
          discussion_points?: string | null
          goal_setting?: string | null
          group_id?: string | null
          id?: string
          issues_raised?: string | null
          mentor_id?: string | null
          next_meeting_date?: string | null
          remarks?: string | null
          signed_by_mentor?: boolean | null
          type?: Database["public"]["Enums"]["meeting_type"] | null
        }
        Update: {
          academic_nonacademic?:
            | Database["public"]["Enums"]["meeting_focus"]
            | null
          action_taken?: string | null
          created_at?: string | null
          date?: string
          discussion_points?: string | null
          goal_setting?: string | null
          group_id?: string | null
          id?: string
          issues_raised?: string | null
          mentor_id?: string | null
          next_meeting_date?: string | null
          remarks?: string | null
          signed_by_mentor?: boolean | null
          type?: Database["public"]["Enums"]["meeting_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_meetings_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "mentorship_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorship_meetings_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      non_scholastic_achievements: {
        Row: {
          category: Database["public"]["Enums"]["non_scholastic_category"]
          created_at: string | null
          department_id: string | null
          description: string
          id: string
          student_id: string | null
          verified_by_dept_head: boolean | null
        }
        Insert: {
          category: Database["public"]["Enums"]["non_scholastic_category"]
          created_at?: string | null
          department_id?: string | null
          description: string
          id?: string
          student_id?: string | null
          verified_by_dept_head?: boolean | null
        }
        Update: {
          category?: Database["public"]["Enums"]["non_scholastic_category"]
          created_at?: string | null
          department_id?: string | null
          description?: string
          id?: string
          student_id?: string | null
          verified_by_dept_head?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "non_scholastic_achievements_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "non_scholastic_achievements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          department_id: string | null
          email: string
          id: string
          institution_id: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          email: string
          id: string
          institution_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          department_id?: string | null
          email?: string
          id?: string
          institution_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      saved_timetables: {
        Row: {
          class_count: number
          course: string
          department: string
          format_id: string
          id: string
          institute_name: string
          month: string
          saved_at: string
        }
        Insert: {
          class_count?: number
          course: string
          department: string
          format_id: string
          id?: string
          institute_name: string
          month: string
          saved_at?: string
        }
        Update: {
          class_count?: number
          course?: string
          department?: string
          format_id?: string
          id?: string
          institute_name?: string
          month?: string
          saved_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_timetables_format_id_fkey"
            columns: ["format_id"]
            isOneToOne: false
            referencedRelation: "timetable_formats"
            referencedColumns: ["id"]
          },
        ]
      }
      script_answers: {
        Row: {
          ai_justification: string | null
          ai_marks: number | null
          ai_missing_keywords: Json | null
          exam_question_id: string | null
          extracted_text: string | null
          id: string
          image_url: string | null
          script_id: string | null
          teacher_override_marks: number | null
        }
        Insert: {
          ai_justification?: string | null
          ai_marks?: number | null
          ai_missing_keywords?: Json | null
          exam_question_id?: string | null
          extracted_text?: string | null
          id?: string
          image_url?: string | null
          script_id?: string | null
          teacher_override_marks?: number | null
        }
        Update: {
          ai_justification?: string | null
          ai_marks?: number | null
          ai_missing_keywords?: Json | null
          exam_question_id?: string | null
          extracted_text?: string | null
          id?: string
          image_url?: string | null
          script_id?: string | null
          teacher_override_marks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "script_answers_exam_question_id_fkey"
            columns: ["exam_question_id"]
            isOneToOne: false
            referencedRelation: "exam_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "script_answers_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "student_scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      student_assessment_records: {
        Row: {
          approved_by_dh: boolean | null
          assessment_paper_id: string | null
          attendance_percentage: number | null
          created_at: string | null
          id: string
          marks_obtained: number | null
          overall_assessment: string | null
          remarks: string | null
          student_id: string | null
        }
        Insert: {
          approved_by_dh?: boolean | null
          assessment_paper_id?: string | null
          attendance_percentage?: number | null
          created_at?: string | null
          id?: string
          marks_obtained?: number | null
          overall_assessment?: string | null
          remarks?: string | null
          student_id?: string | null
        }
        Update: {
          approved_by_dh?: boolean | null
          assessment_paper_id?: string | null
          attendance_percentage?: number | null
          created_at?: string | null
          id?: string
          marks_obtained?: number | null
          overall_assessment?: string | null
          remarks?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_assessment_records_assessment_paper_id_fkey"
            columns: ["assessment_paper_id"]
            isOneToOne: false
            referencedRelation: "assessment_papers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_assessment_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          course: string | null
          department_id: string | null
          designation: string | null
          institution_id: string | null
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          permanent_address: string | null
          registration_number: string | null
          university_id: string | null
          user_id: string
          year: number | null
        }
        Insert: {
          course?: string | null
          department_id?: string | null
          designation?: string | null
          institution_id?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          permanent_address?: string | null
          registration_number?: string | null
          university_id?: string | null
          user_id: string
          year?: number | null
        }
        Update: {
          course?: string | null
          department_id?: string | null
          designation?: string | null
          institution_id?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          permanent_address?: string | null
          registration_number?: string | null
          university_id?: string | null
          user_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      student_scripts: {
        Row: {
          created_at: string | null
          exam_id: string | null
          id: string
          roll_no: string
          status: string | null
          student_name: string
          total_marks: number | null
        }
        Insert: {
          created_at?: string | null
          exam_id?: string | null
          id?: string
          roll_no: string
          status?: string | null
          student_name: string
          total_marks?: number | null
        }
        Update: {
          created_at?: string | null
          exam_id?: string | null
          id?: string
          roll_no?: string
          status?: string | null
          student_name?: string
          total_marks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_scripts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "examinations"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          course_id: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_formats: {
        Row: {
          course: string
          created_at: string
          department: string
          faculty_members: Json | null
          id: string
          institute_logo_url: string | null
          institute_name: string
          students_list: Json | null
          topics_pool: Json | null
          updated_at: string
          user_id: string | null
          weekly_slots: Json | null
        }
        Insert: {
          course: string
          created_at?: string
          department: string
          faculty_members?: Json | null
          id?: string
          institute_logo_url?: string | null
          institute_name: string
          students_list?: Json | null
          topics_pool?: Json | null
          updated_at?: string
          user_id?: string | null
          weekly_slots?: Json | null
        }
        Update: {
          course?: string
          created_at?: string
          department?: string
          faculty_members?: Json | null
          id?: string
          institute_logo_url?: string | null
          institute_name?: string
          students_list?: Json | null
          topics_pool?: Json | null
          updated_at?: string
          user_id?: string | null
          weekly_slots?: Json | null
        }
        Relationships: []
      }
      timetable_holidays: {
        Row: {
          created_at: string
          date: string
          details: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          date: string
          details?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          details?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      timetable_schedules: {
        Row: {
          activity: string
          batch: string
          competency_no: string | null
          created_at: string
          date: string
          format_id: string
          id: string
          staff_name: string
          topic_id: string | null
          topic_name: string
        }
        Insert: {
          activity?: string
          batch?: string
          competency_no?: string | null
          created_at?: string
          date: string
          format_id: string
          id?: string
          staff_name: string
          topic_id?: string | null
          topic_name: string
        }
        Update: {
          activity?: string
          batch?: string
          competency_no?: string | null
          created_at?: string
          date?: string
          format_id?: string
          id?: string
          staff_name?: string
          topic_id?: string | null
          topic_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetable_schedules_format_id_fkey"
            columns: ["format_id"]
            isOneToOne: false
            referencedRelation: "timetable_formats"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          competency_no: string | null
          created_at: string | null
          id: string
          name: string
          section: string | null
          sn: number | null
          subject_id: string | null
        }
        Insert: {
          competency_no?: string | null
          created_at?: string | null
          id?: string
          name: string
          section?: string | null
          sn?: number | null
          subject_id?: string | null
        }
        Update: {
          competency_no?: string | null
          created_at?: string | null
          id?: string
          name?: string
          section?: string | null
          sn?: number | null
          subject_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_limits: {
        Row: {
          id: string
          last_reset_date: string | null
          mentor_questions_today: number | null
          plan_type: string | null
          trial_start_date: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          last_reset_date?: string | null
          mentor_questions_today?: number | null
          plan_type?: string | null
          trial_start_date?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          last_reset_date?: string | null
          mentor_questions_today?: number | null
          plan_type?: string | null
          trial_start_date?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
        }
        Relationships: []
      }
      year_end_reports: {
        Row: {
          academic_year: string
          approved_by_coordinator: boolean | null
          assessment_remarks: string | null
          attendance_remarks: string | null
          created_at: string | null
          group_id: string | null
          id: string
          non_scholastic_remarks: string | null
          signed_by_mentor: boolean | null
          student_id: string | null
        }
        Insert: {
          academic_year: string
          approved_by_coordinator?: boolean | null
          assessment_remarks?: string | null
          attendance_remarks?: string | null
          created_at?: string | null
          group_id?: string | null
          id?: string
          non_scholastic_remarks?: string | null
          signed_by_mentor?: boolean | null
          student_id?: string | null
        }
        Update: {
          academic_year?: string
          approved_by_coordinator?: boolean | null
          assessment_remarks?: string | null
          attendance_remarks?: string | null
          created_at?: string | null
          group_id?: string | null
          id?: string
          non_scholastic_remarks?: string | null
          signed_by_mentor?: boolean | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "year_end_reports_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "mentorship_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "year_end_reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_auth_department_id: { Args: never; Returns: string }
      get_auth_institution_id: { Args: never; Returns: string }
      get_auth_role: { Args: never; Returns: string }
      increment_view_count: { Args: { blog_id: string }; Returns: undefined }
    }
    Enums: {
      dh_assessment_mode:
        | "theory"
        | "practical"
        | "viva"
        | "clinical"
        | "custom"
      dh_assessment_type: "formative" | "internal" | "clinical" | "summative"
      meeting_focus: "academic" | "nonacademic" | "both"
      meeting_type: "mentor_meeting" | "peer_meeting"
      non_scholastic_category:
        | "research"
        | "sports"
        | "cultural"
        | "leadership"
        | "volunteering"
        | "awards"
      user_role:
        | "student"
        | "teacher"
        | "admin"
        | "instadmin"
        | "deptadmin"
        | "department_admin"
        | "institution_admin"
        | "master_admin"
        | "super_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      dh_assessment_mode: ["theory", "practical", "viva", "clinical", "custom"],
      dh_assessment_type: ["formative", "internal", "clinical", "summative"],
      meeting_focus: ["academic", "nonacademic", "both"],
      meeting_type: ["mentor_meeting", "peer_meeting"],
      non_scholastic_category: [
        "research",
        "sports",
        "cultural",
        "leadership",
        "volunteering",
        "awards",
      ],
      user_role: [
        "student",
        "teacher",
        "admin",
        "instadmin",
        "deptadmin",
        "department_admin",
        "institution_admin",
        "master_admin",
        "super_admin",
      ],
    },
  },
} as const
