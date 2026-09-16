export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProfileStatus = "alive" | "verified_dead";
export type MessageMediaType = "audio" | "video";

export interface Database {
  public: {
    Tables: {
      death_verifications: {
        Row: {
          id: string;
          profile_id: string | null;
          reporter_email: string;
          deceased_name: string;
          certificate_path: string;
          status: string;
          created_at: string;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          reporter_email: string;
          deceased_name: string;
          certificate_path: string;
          status?: string;
          created_at?: string;
          reviewed_at?: string | null;
        };
        Update: {
          id?: string;
          profile_id?: string | null;
          reporter_email?: string;
          deceased_name?: string;
          certificate_path?: string;
          status?: string;
          created_at?: string;
          reviewed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "death_verifications_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles_audit: {
        Row: {
          id: string;
          profile_id: string;
          action: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          action: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          action?: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_audit_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          profile_id: string;
          title: string;
          media_type: MessageMediaType;
          storage_path: string;
          original_file_name: string;
          file_size_bytes: number;
          is_unlocked: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          title: string;
          media_type: MessageMediaType;
          storage_path: string;
          original_file_name: string;
          file_size_bytes: number;
          is_unlocked?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          title?: string;
          media_type?: MessageMediaType;
          storage_path?: string;
          original_file_name?: string;
          file_size_bytes?: number;
          is_unlocked?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          status: ProfileStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          status?: ProfileStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          status?: ProfileStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      recipients: {
        Row: {
          id: string;
          message_id: string;
          email: string;
          access_token: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          email: string;
          access_token: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          email?: string;
          access_token?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recipients_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
        ];
      };
      vouchers: {
        Row: {
          id: string;
          partner_id: string | null;
          code: string;
          is_redeemed: boolean;
          redeemed_by_profile_id: string | null;
          redeemed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          partner_id?: string | null;
          code: string;
          is_redeemed?: boolean;
          redeemed_by_profile_id?: string | null;
          redeemed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          partner_id?: string | null;
          code?: string;
          is_redeemed?: boolean;
          redeemed_by_profile_id?: string | null;
          redeemed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vouchers_partner_id_fkey";
            columns: ["partner_id"];
            isOneToOne: false;
            referencedRelation: "b2b_partners";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vouchers_redeemed_by_profile_id_fkey";
            columns: ["redeemed_by_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      b2b_partners: {
        Row: {
          id: string;
          company_name: string;
          contact_email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_name: string;
          contact_email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_name?: string;
          contact_email?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];
export type RecipientInsert =
  Database["public"]["Tables"]["recipients"]["Insert"];
export type Voucher = Database["public"]["Tables"]["vouchers"]["Row"];
