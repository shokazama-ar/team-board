export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      member_profiles: {
        Row: {
          id: string;
          user_id: string;
          kind: "coach" | "player";
          name: string | null;
          avatar_url: string | null;
          number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind?: "coach" | "player";
          name?: string | null;
          avatar_url?: string | null;
          number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          kind?: "coach" | "player";
          name?: string | null;
          avatar_url?: string | null;
          number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "member_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      teams: {
        Row: {
          id: string;
          name: string;
          icon_url: string | null;
          invite_code_guardian: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          icon_url?: string | null;
          invite_code_guardian?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          icon_url?: string | null;
          invite_code_guardian?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teams_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          member_profile_id: string;
          role: "admin" | "member";
          account_type: "coach" | "guardian";
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          member_profile_id: string;
          role?: "admin" | "member";
          account_type?: "coach" | "guardian";
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          member_profile_id?: string;
          role?: "admin" | "member";
          account_type?: "coach" | "guardian";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_members_member_profile_id_fkey";
            columns: ["member_profile_id"];
            isOneToOne: false;
            referencedRelation: "member_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      event_types: {
        Row: {
          id: string;
          team_id: string;
          name: string;
          color: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          name: string;
          color?: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          name?: string;
          color?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_types_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          id: string;
          team_id: string;
          title: string;
          event_type: string;
          event_type_id: string | null;
          date: string;
          location: string | null;
          memo: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          title: string;
          event_type?: string;
          event_type_id?: string | null;
          date: string;
          location?: string | null;
          memo?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          title?: string;
          event_type?: string;
          event_type_id?: string | null;
          date?: string;
          location?: string | null;
          memo?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "events_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_event_type_id_fkey";
            columns: ["event_type_id"];
            isOneToOne: false;
            referencedRelation: "event_types";
            referencedColumns: ["id"];
          },
        ];
      };
      attendances: {
        Row: {
          id: string;
          event_id: string;
          member_profile_id: string;
          status: "present" | "absent" | "undecided";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          member_profile_id: string;
          status?: "present" | "absent" | "undecided";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          member_profile_id?: string;
          status?: "present" | "absent" | "undecided";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendances_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendances_member_profile_id_fkey";
            columns: ["member_profile_id"];
            isOneToOne: false;
            referencedRelation: "member_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      announcements: {
        Row: {
          id: string;
          team_id: string;
          author_id: string;
          title: string;
          body: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          author_id: string;
          title: string;
          body: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          author_id?: string;
          title?: string;
          body?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "announcements_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "announcements_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_member_of_team: {
        Args: { tid: string };
        Returns: boolean;
      };
      is_admin_of_team: {
        Args: { tid: string };
        Returns: boolean;
      };
      owns_member_profile: {
        Args: { profile_id: string };
        Returns: boolean;
      };
      get_my_team_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      create_team_with_member: {
        Args: { team_name: string; profile_name?: string; profile_kind?: string };
        Returns: string;
      };
      join_team_with_profile: {
        Args: { code: string; profile_name?: string; profile_kind?: string };
        Returns: string;
      };
      add_profile_to_team: {
        Args: { target_team_id: string; profile_name: string; profile_kind?: string };
        Returns: string;
      };
      regenerate_guardian_invite_code: {
        Args: { target_team_id: string };
        Returns: string;
      };
      is_coach_in_team: {
        Args: { tid: string };
        Returns: boolean;
      };
      grant_coach_role: {
        Args: { target_user_id: string };
        Returns: void;
      };
      revoke_coach_role: {
        Args: { target_user_id: string };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
