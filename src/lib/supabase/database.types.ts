export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      booking_extras: {
        Row: {
          booking_id: string;
          extra_name: string;
          id: string;
          price_per_day: number;
          quantity: number;
          total: number;
        };
        Insert: {
          booking_id: string;
          extra_name: string;
          id?: string;
          price_per_day: number;
          quantity?: number;
          total: number;
        };
        Update: {
          booking_id?: string;
          extra_name?: string;
          id?: string;
          price_per_day?: number;
          quantity?: number;
          total?: number;
        };
        Relationships: [
          {
            foreignKeyName: "booking_extras_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      booking_internal_notes: {
        Row: {
          author_display_label: string;
          author_identifier: string;
          body: string;
          booking_id: string;
          created_at: string;
          id: string;
          is_pinned: boolean;
        };
        Insert: {
          author_display_label?: string;
          author_identifier?: string;
          body: string;
          booking_id: string;
          created_at?: string;
          id?: string;
          is_pinned?: boolean;
        };
        Update: {
          author_display_label?: string;
          author_identifier?: string;
          body?: string;
          booking_id?: string;
          created_at?: string;
          id?: string;
          is_pinned?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "booking_internal_notes_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      bookings: {
        Row: {
          accommodation: string | null;
          additional_driver_license: string | null;
          additional_driver_date_of_birth: string | null;
          additional_driver_name: string | null;
          applied_discount_id: string | null;
          archive_reason: string | null;
          archived_at: string | null;
          archived_by: string | null;
          car_id: string;
          cancellation_fee: number | null;
          cancellation_fee_accepted_at: string | null;
          checkout_session_id: string | null;
          collection_address: string | null;
          confirmation_source: string | null;
          confirmed_at: string | null;
          created_at: string;
          delivery_address: string | null;
          delivery_type: string | null;
          deposit_amount: number | null;
          driver_age_confirmed: boolean;
          driver_license_number: string | null;
          extras_total: number;
          flight_number: string | null;
          gas_deposit_amount: number | null;
          guest_email: string;
          guest_name: string;
          guest_phone: string;
          hold_started_at: string | null;
          id: string;
          insurance_daily_rate: number | null;
          insurance_option: string | null;
          insurance_total: number | null;
          locale: string;
          payment_status: Database["public"]["Enums"]["payment_status"];
          payment_provider: string;
          pending_expires_at: string | null;
          pickup_date: string;
          pickup_location: string;
          pickup_time: string;
          priced_daily_rate: number | null;
          primary_driver_date_of_birth: string | null;
          return_date: string;
          return_location: string;
          return_time: string;
          sentoo_status: string | null;
          sentoo_checkout_request_id: string | null;
          sentoo_checkout_started_at: string | null;
          sentoo_transaction_id: string | null;
          status: Database["public"]["Enums"]["booking_status"];
          stripe_payment_intent_id: string | null;
          subtotal: number;
          total: number;
          user_id: string | null;
          expired_at: string | null;
          expiration_reason: string | null;
        };
        Insert: {
          accommodation?: string | null;
          additional_driver_license?: string | null;
          additional_driver_date_of_birth?: string | null;
          additional_driver_name?: string | null;
          applied_discount_id?: string | null;
          archive_reason?: string | null;
          archived_at?: string | null;
          archived_by?: string | null;
          car_id: string;
          checkout_session_id?: string | null;
          collection_address?: string | null;
          confirmation_source?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          delivery_address?: string | null;
          delivery_type?: string | null;
          deposit_amount?: number | null;
          driver_age_confirmed?: boolean;
          driver_license_number?: string | null;
          expired_at?: string | null;
          expiration_reason?: string | null;
          extras_total?: number;
          flight_number?: string | null;
          gas_deposit_amount?: number | null;
          guest_email: string;
          guest_name: string;
          guest_phone: string;
          hold_started_at?: string | null;
          id?: string;
          insurance_daily_rate?: number | null;
          insurance_option?: string | null;
          insurance_total?: number | null;
          locale?: string;
          payment_provider?: string;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          pending_expires_at?: string | null;
          pickup_date: string;
          pickup_location: string;
          pickup_time: string;
          priced_daily_rate?: number | null;
          primary_driver_date_of_birth?: string | null;
          return_date: string;
          return_location: string;
          return_time: string;
          sentoo_status?: string | null;
          sentoo_checkout_request_id?: string | null;
          sentoo_checkout_started_at?: string | null;
          sentoo_transaction_id?: string | null;
          status?: Database["public"]["Enums"]["booking_status"];
          stripe_payment_intent_id?: string | null;
          subtotal: number;
          total: number;
          user_id?: string | null;
        };
        Update: {
          accommodation?: string | null;
          additional_driver_license?: string | null;
          additional_driver_date_of_birth?: string | null;
          additional_driver_name?: string | null;
          applied_discount_id?: string | null;
          archive_reason?: string | null;
          archived_at?: string | null;
          archived_by?: string | null;
          car_id?: string;
          checkout_session_id?: string | null;
          collection_address?: string | null;
          confirmation_source?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          delivery_address?: string | null;
          delivery_type?: string | null;
          deposit_amount?: number | null;
          driver_age_confirmed?: boolean;
          driver_license_number?: string | null;
          expired_at?: string | null;
          expiration_reason?: string | null;
          extras_total?: number;
          flight_number?: string | null;
          gas_deposit_amount?: number | null;
          guest_email?: string;
          guest_name?: string;
          guest_phone?: string;
          hold_started_at?: string | null;
          id?: string;
          insurance_daily_rate?: number | null;
          insurance_option?: string | null;
          insurance_total?: number | null;
          locale?: string;
          payment_provider?: string;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          pending_expires_at?: string | null;
          pickup_date?: string;
          pickup_location?: string;
          pickup_time?: string;
          priced_daily_rate?: number | null;
          primary_driver_date_of_birth?: string | null;
          return_date?: string;
          return_location?: string;
          return_time?: string;
          sentoo_status?: string | null;
          sentoo_checkout_request_id?: string | null;
          sentoo_checkout_started_at?: string | null;
          sentoo_transaction_id?: string | null;
          status?: Database["public"]["Enums"]["booking_status"];
          stripe_payment_intent_id?: string | null;
          subtotal?: number;
          total?: number;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_applied_discount_id_fkey";
            columns: ["applied_discount_id"];
            isOneToOne: false;
            referencedRelation: "pricing_discounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_car_id_fkey";
            columns: ["car_id"];
            isOneToOne: false;
            referencedRelation: "cars";
            referencedColumns: ["id"];
          },
        ];
      };
      booking_change_events: {
        Row: {
          booking_id: string;
          change_type: string;
          created_at: string;
          id: string;
          new_values: Json;
          old_values: Json;
          price_delta: number;
          source: string;
          user_id: string | null;
        };
        Insert: {
          booking_id: string;
          change_type: string;
          created_at?: string;
          id?: string;
          new_values?: Json;
          old_values?: Json;
          price_delta?: number;
          source?: string;
          user_id?: string | null;
        };
        Update: {
          booking_id?: string;
          change_type?: string;
          created_at?: string;
          id?: string;
          new_values?: Json;
          old_values?: Json;
          price_delta?: number;
          source?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "booking_change_events_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "booking_change_events_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      cars: {
        Row: {
          ac: boolean;
          bags: number;
          category: string;
          created_at: string;
          daily_price: number;
          fleet_status: string;
          fuel_type: string;
          id: string;
          image_url: string | null;
          is_active: boolean;
          license_plate: string | null;
          mileage: number | null;
          name: string;
          seats: number;
          transmission: string;
          year: number;
        };
        Insert: {
          ac?: boolean;
          bags?: number;
          category: string;
          created_at?: string;
          daily_price: number;
          fleet_status?: string;
          fuel_type?: string;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          license_plate?: string | null;
          mileage?: number | null;
          name: string;
          seats: number;
          transmission?: string;
          year: number;
        };
        Update: {
          ac?: boolean;
          bags?: number;
          category?: string;
          created_at?: string;
          daily_price?: number;
          fleet_status?: string;
          fuel_type?: string;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          license_plate?: string | null;
          mileage?: number | null;
          name?: string;
          seats?: number;
          transmission?: string;
          year?: number;
        };
        Relationships: [];
      };
      extras: {
        Row: {
          description: string | null;
          id: string;
          is_active: boolean;
          name: string;
          price_per_day: number;
        };
        Insert: {
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          price_per_day?: number;
        };
        Update: {
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          price_per_day?: number;
        };
        Relationships: [];
      };
      pricing_discounts: {
        Row: {
          car_id: string | null;
          created_at: string;
          created_by: string | null;
          discount_type: string;
          discount_value: number;
          ends_at: string;
          id: string;
          is_active: boolean;
          name: string;
          scope: string;
          starts_at: string;
          updated_at: string;
        };
        Insert: {
          car_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          discount_type: string;
          discount_value: number;
          ends_at: string;
          id?: string;
          is_active?: boolean;
          name: string;
          scope: string;
          starts_at: string;
          updated_at?: string;
        };
        Update: {
          car_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          discount_type?: string;
          discount_value?: number;
          ends_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          scope?: string;
          starts_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pricing_discounts_car_id_fkey";
            columns: ["car_id"];
            isOneToOne: false;
            referencedRelation: "cars";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          marketing_email: boolean;
          marketing_whatsapp: boolean;
          phone: string | null;
          role: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          marketing_email?: boolean;
          marketing_whatsapp?: boolean;
          phone?: string | null;
          role?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          marketing_email?: boolean;
          marketing_whatsapp?: boolean;
          phone?: string | null;
          role?: string;
        };
        Relationships: [];
      };
      drivers: {
        Row: {
          created_at: string;
          date_of_birth: string | null;
          full_name: string;
          id: string;
          license_number: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          date_of_birth?: string | null;
          full_name: string;
          id?: string;
          license_number: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          date_of_birth?: string | null;
          full_name?: string;
          id?: string;
          license_number?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "drivers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          deletion_due_at: string | null;
          deletion_reason: string | null;
          document_type: Database["public"]["Enums"]["document_type"];
          file_url: string;
          file_name: string;
          file_path: string | null;
          file_size: number | null;
          id: string;
          mime_type: string | null;
          uploaded_at: string;
          user_id: string;
          verified_at: string | null;
          verified_by: string | null;
          verification_status: Database["public"]["Enums"]["verification_status"];
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          deletion_due_at?: string | null;
          deletion_reason?: string | null;
          document_type: Database["public"]["Enums"]["document_type"];
          file_url?: string;
          file_name: string;
          file_path?: string | null;
          file_size?: number | null;
          id?: string;
          mime_type?: string | null;
          uploaded_at?: string;
          user_id: string;
          verified_at?: string | null;
          verified_by?: string | null;
          verification_status?: Database["public"]["Enums"]["verification_status"];
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          deletion_due_at?: string | null;
          deletion_reason?: string | null;
          document_type?: Database["public"]["Enums"]["document_type"];
          file_url?: string;
          file_name?: string;
          file_path?: string | null;
          file_size?: number | null;
          id?: string;
          mime_type?: string | null;
          uploaded_at?: string;
          user_id?: string;
          verified_at?: string | null;
          verified_by?: string | null;
          verification_status?: Database["public"]["Enums"]["verification_status"];
        };
        Relationships: [
          {
            foreignKeyName: "documents_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      maintenance_job_runs: {
        Row: {
          error_message: string | null;
          finished_at: string | null;
          id: string;
          job_name: string;
          processed_count: number;
          started_at: string;
          status: string;
        };
        Insert: {
          error_message?: string | null;
          finished_at?: string | null;
          id?: string;
          job_name: string;
          processed_count?: number;
          started_at?: string;
          status?: string;
        };
        Update: {
          error_message?: string | null;
          finished_at?: string | null;
          id?: string;
          job_name?: string;
          processed_count?: number;
          started_at?: string;
          status?: string;
        };
        Relationships: [];
      };
      email_deliveries: {
        Row: {
          attempts: number;
          booking_id: string | null;
          created_at: string;
          customer_id: string | null;
          document_id: string | null;
          id: string;
          idempotency_key: string;
          last_error: string | null;
          locale: string;
          next_attempt_at: string;
          payload: Json;
          recipient_email: string;
          sent_at: string | null;
          status: string;
          template_key: string;
          updated_at: string;
        };
        Insert: {
          attempts?: number;
          booking_id?: string | null;
          created_at?: string;
          customer_id?: string | null;
          document_id?: string | null;
          id?: string;
          idempotency_key: string;
          last_error?: string | null;
          locale?: string;
          next_attempt_at?: string;
          payload?: Json;
          recipient_email: string;
          sent_at?: string | null;
          status?: string;
          template_key: string;
          updated_at?: string;
        };
        Update: {
          attempts?: number;
          booking_id?: string | null;
          created_at?: string;
          customer_id?: string | null;
          document_id?: string | null;
          id?: string;
          idempotency_key?: string;
          last_error?: string | null;
          locale?: string;
          next_attempt_at?: string;
          payload?: Json;
          recipient_email?: string;
          sent_at?: string | null;
          status?: string;
          template_key?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "email_deliveries_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "email_deliveries_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reward_transactions: {
        Row: {
          booking_id: string | null;
          created_at: string;
          created_by: string | null;
          customer_email: string | null;
          customer_id: string | null;
          id: string;
          idempotency_key: string;
          metadata: Json;
          points_delta: number;
          reason: string;
          status: string;
          transaction_type: string;
        };
        Insert: {
          booking_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          customer_email?: string | null;
          customer_id?: string | null;
          id?: string;
          idempotency_key: string;
          metadata?: Json;
          points_delta: number;
          reason: string;
          status?: string;
          transaction_type: string;
        };
        Update: {
          booking_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          customer_email?: string | null;
          customer_id?: string | null;
          id?: string;
          idempotency_key?: string;
          metadata?: Json;
          points_delta?: number;
          reason?: string;
          status?: string;
          transaction_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reward_transactions_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reward_transactions_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reward_redemptions: {
        Row: {
          applied_at: string | null;
          booking_id: string | null;
          credit_amount: number;
          created_at: string;
          customer_id: string;
          id: string;
          idempotency_key: string;
          points: number;
          status: string;
        };
        Insert: {
          applied_at?: string | null;
          booking_id?: string | null;
          credit_amount: number;
          created_at?: string;
          customer_id: string;
          id?: string;
          idempotency_key: string;
          points: number;
          status?: string;
        };
        Update: {
          applied_at?: string | null;
          booking_id?: string | null;
          credit_amount?: number;
          created_at?: string;
          customer_id?: string;
          id?: string;
          idempotency_key?: string;
          points?: number;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reward_redemptions_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reward_config: {
        Row: {
          key: string;
          updated_at: string;
          value: Json;
        };
        Insert: {
          key: string;
          updated_at?: string;
          value?: Json;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: Json;
        };
        Relationships: [];
      };
      admin_settings: {
        Row: {
          id: string;
          key: string;
          updated_at: string;
          value: Json;
        };
        Insert: {
          id?: string;
          key: string;
          updated_at?: string;
          value?: Json;
        };
        Update: {
          id?: string;
          key?: string;
          updated_at?: string;
          value?: Json;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      confirm_booking_sentoo_payment: {
        Args: { p_booking_id: string; p_transaction_id?: string | null };
        Returns: undefined;
      };
      claim_booking_sentoo_checkout: {
        Args: {
          p_booking_id: string;
          p_checkout_session_id: string;
          p_request_id: string;
        };
        Returns: Json;
      };
      complete_booking_sentoo_checkout: {
        Args: {
          p_booking_id: string;
          p_checkout_session_id: string;
          p_request_id: string;
          p_status?: string;
          p_transaction_id: string;
        };
        Returns: undefined;
      };
      release_booking_sentoo_checkout: {
        Args: {
          p_booking_id: string;
          p_checkout_session_id: string;
          p_request_id: string;
        };
        Returns: undefined;
      };
      claim_checkout_hold_slot: {
        Args: { p_checkout_session_id: string; p_fingerprint_hash: string };
        Returns: string;
      };
      complete_checkout_hold_slot: {
        Args: {
          p_booking_id: string;
          p_checkout_session_id: string;
          p_claim_id: string;
          p_expires_at: string;
          p_fingerprint_hash: string;
        };
        Returns: undefined;
      };
      release_checkout_hold_slot: {
        Args: {
          p_checkout_session_id: string;
          p_claim_id: string;
          p_fingerprint_hash: string;
        };
        Returns: undefined;
      };
      get_booking_id_by_sentoo_transaction: {
        Args: { p_transaction_id: string };
        Returns: string;
      };
      set_booking_sentoo_transaction: {
        Args: { p_booking_id: string; p_transaction_id: string; p_status?: string };
        Returns: undefined;
      };
      update_booking_sentoo_status: {
        Args: { p_booking_id: string; p_status: string };
        Returns: undefined;
      };
      confirm_booking_payment: {
        Args: { p_booking_id: string; p_payment_intent_id?: string | null };
        Returns: undefined;
      };
      confirm_booking_pay_at_arrival: {
        Args: { p_booking_id: string };
        Returns: undefined;
      };
      car_has_booking_conflict: {
        Args: {
          p_car_id: string;
          p_pickup: string;
          p_return: string;
          p_exclude_booking_id?: string | null;
        };
        Returns: boolean;
      };
      create_checkout_hold: {
        Args: {
          p_car_id: string;
          p_checkout_session_id: string;
          p_collection_address: string;
          p_delivery_address: string;
          p_delivery_type: string;
          p_pickup_date: string;
          p_pickup_time: string;
          p_return_date: string;
          p_return_time: string;
        };
        Returns: Json;
      };
      finalize_checkout_hold: {
        Args: {
          p_accommodation: string;
          p_additional_driver_license?: string | null;
          p_additional_driver_date_of_birth?: string | null;
          p_additional_driver_name?: string | null;
          p_applied_discount_id?: string | null;
          p_booking_id: string;
          p_checkout_session_id: string;
          p_collection_address: string;
          p_delivery_address: string;
          p_delivery_type: string;
          p_deposit_amount?: number | null;
          p_driver_age_confirmed: boolean;
          p_driver_license: string;
          p_primary_driver_date_of_birth: string;
          p_extras: Json;
          p_extras_total: number;
          p_flight_number: string;
          p_gas_deposit_amount?: number | null;
          p_guest_email: string;
          p_guest_name: string;
          p_guest_phone: string;
          p_insurance_daily_rate?: number | null;
          p_insurance_option: string;
          p_insurance_total?: number | null;
          p_priced_daily_rate?: number | null;
          p_subtotal: number;
          p_total: number;
        };
        Returns: string;
      };
      create_pending_booking: {
        Args: {
          p_accommodation: string;
          p_additional_driver_license?: string | null;
          p_additional_driver_date_of_birth?: string | null;
          p_additional_driver_name?: string | null;
          p_applied_discount_id?: string | null;
          p_car_id: string;
          p_collection_address: string;
          p_delivery_address: string;
          p_delivery_type: string;
          p_deposit_amount?: number | null;
          p_driver_age_confirmed: boolean;
          p_driver_license: string;
          p_primary_driver_date_of_birth: string;
          p_extras: Json;
          p_extras_total: number;
          p_flight_number: string;
          p_gas_deposit_amount?: number | null;
          p_guest_email: string;
          p_guest_name: string;
          p_guest_phone: string;
          p_insurance_daily_rate?: number | null;
          p_insurance_option: string;
          p_insurance_total?: number | null;
          p_pickup_date: string;
          p_pickup_location: string;
          p_pickup_time: string;
          p_priced_daily_rate?: number | null;
          p_return_date: string;
          p_return_location: string;
          p_return_time: string;
          p_subtotal: number;
          p_total: number;
          p_user_id?: string | null;
        };
        Returns: string;
      };
      delete_user_account: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      delete_own_pending_document: {
        Args: { p_document_id: string };
        Returns: undefined;
      };
      get_my_deleted_document_tombstones: {
        Args: Record<string, never>;
        Returns: {
          document_id: string;
          document_type: Database["public"]["Enums"]["document_type"];
          verification_status: Database["public"]["Enums"]["verification_status"];
          deleted_at: string;
          uploaded_at: string;
          file_name: string;
        }[];
      };
      get_booking_by_id: {
        Args: { p_booking_id: string };
        Returns: Json;
      };
      get_car_availability: {
        Args: { p_pickup: string; p_return: string };
        Returns: {
          ac: boolean;
          available: boolean;
          bags: number;
          base_daily_price: number;
          blocked_through_date: string | null;
          category: string;
          created_at: string;
          daily_price: number;
          discount_id: string | null;
          discount_label: string | null;
          fuel_type: string;
          id: string;
          image_url: string | null;
          is_active: boolean;
          name: string;
          next_available_date: string | null;
          seats: number;
          transmission: string;
          year: number;
        }[];
      };
      link_bookings_to_user: {
        Args: Record<string, never>;
        Returns: number;
      };
      lookup_email_for_login: {
        Args: { p_email: string };
        Returns: Json;
      };
      pricing_discount_has_overlap: {
        Args: {
          p_car_id: string | null;
          p_ends_at: string;
          p_exclude_id?: string | null;
          p_scope: string;
          p_starts_at: string;
        };
        Returns: boolean;
      };
      resolve_effective_daily_price: {
        Args: { p_at?: string; p_car_id: string };
        Returns: {
          base_price: number;
          discount_id: string | null;
          discount_label: string | null;
          effective_price: number;
        }[];
      };
      cancel_booking: {
        Args: { p_booking_id: string; p_accept_cancellation_fee?: boolean };
        Returns: undefined;
      };
      update_booking_rental: {
        Args: {
          p_booking_id: string;
          p_pickup_date?: string | null;
          p_return_date?: string | null;
          p_delivery_address?: string | null;
          p_collection_address?: string | null;
          p_car_id?: string | null;
        };
        Returns: undefined;
      };
      update_booking_service_items: {
        Args: {
          p_booking_id: string;
          p_delivery_address?: string | null;
          p_collection_address?: string | null;
          p_add_extras?: Json;
          p_additional_driver_name?: string | null;
          p_additional_driver_license?: string | null;
        };
        Returns: {
          old_total: number;
          new_total: number;
          price_delta: number;
        }[];
      };
      set_booking_payment_intent: {
        Args: { p_booking_id: string; p_payment_intent_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      booking_status: "pending" | "confirmed" | "cancelled";
      document_type: "driver_license" | "passport_id" | "id_card";
      payment_status: "unpaid" | "paid" | "failed";
      verification_status: "uploaded" | "pending" | "verified" | "approved" | "rejected";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
