export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          color: string | null
          created_at: string
          currency: string
          current_balance_cents: number
          icon: string | null
          id: string
          initial_balance_cents: number
          is_active: boolean
          name: string
          type: Database["public"]["Enums"]["account_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          currency?: string
          current_balance_cents?: number
          icon?: string | null
          id?: string
          initial_balance_cents?: number
          is_active?: boolean
          name: string
          type: Database["public"]["Enums"]["account_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          currency?: string
          current_balance_cents?: number
          icon?: string | null
          id?: string
          initial_balance_cents?: number
          is_active?: boolean
          name?: string
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          alert_thresholds: number[]
          category_id: string
          created_at: string
          description: string | null
          due_day: number | null
          id: string
          kind: Database["public"]["Enums"]["budget_kind"]
          limit_cents: number
          period_month: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_thresholds?: number[]
          category_id: string
          created_at?: string
          description?: string | null
          due_day?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["budget_kind"]
          limit_cents: number
          period_month: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_thresholds?: number[]
          category_id?: string
          created_at?: string
          description?: string | null
          due_day?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["budget_kind"]
          limit_cents?: number
          period_month?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      card_invoices: {
        Row: {
          closing_date: string
          created_at: string
          credit_card_id: string
          due_date: string
          id: string
          paid_amount_cents: number | null
          paid_at: string | null
          reference_month: string
          status: Database["public"]["Enums"]["card_invoice_status"]
          total_amount_cents: number
          updated_at: string
        }
        Insert: {
          closing_date: string
          created_at?: string
          credit_card_id: string
          due_date: string
          id?: string
          paid_amount_cents?: number | null
          paid_at?: string | null
          reference_month: string
          status?: Database["public"]["Enums"]["card_invoice_status"]
          total_amount_cents?: number
          updated_at?: string
        }
        Update: {
          closing_date?: string
          created_at?: string
          credit_card_id?: string
          due_date?: string
          id?: string
          paid_amount_cents?: number | null
          paid_at?: string | null
          reference_month?: string
          status?: Database["public"]["Enums"]["card_invoice_status"]
          total_amount_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_invoices_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_system_default: boolean
          kind: Database["public"]["Enums"]["category_kind"]
          name: string
          parent_category_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_system_default?: boolean
          kind: Database["public"]["Enums"]["category_kind"]
          name: string
          parent_category_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_system_default?: boolean
          kind?: Database["public"]["Enums"]["category_kind"]
          name?: string
          parent_category_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_cards: {
        Row: {
          brand: string | null
          closing_day: number
          color: string | null
          created_at: string
          due_day: number
          icon: string | null
          id: string
          is_active: boolean
          limit_cents: number
          name: string
          payment_account_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand?: string | null
          closing_day: number
          color?: string | null
          created_at?: string
          due_day: number
          icon?: string | null
          id?: string
          is_active?: boolean
          limit_cents?: number
          name: string
          payment_account_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string | null
          closing_day?: number
          color?: string | null
          created_at?: string
          due_day?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          limit_cents?: number
          name?: string
          payment_account_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_cards_payment_account_id_fkey"
            columns: ["payment_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          color: string | null
          created_at: string
          current_amount_cents: number
          icon: string | null
          id: string
          linked_account_id: string | null
          name: string
          status: Database["public"]["Enums"]["goal_status"]
          target_amount_cents: number
          target_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          current_amount_cents?: number
          icon?: string | null
          id?: string
          linked_account_id?: string | null
          name: string
          status?: Database["public"]["Enums"]["goal_status"]
          target_amount_cents: number
          target_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          current_amount_cents?: number
          icon?: string | null
          id?: string
          linked_account_id?: string | null
          name?: string
          status?: Database["public"]["Enums"]["goal_status"]
          target_amount_cents?: number
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_linked_account_id_fkey"
            columns: ["linked_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      installment_plans: {
        Row: {
          account_id: string
          category_id: string
          created_at: string
          credit_card_id: string | null
          description: string
          first_due_date: string
          id: string
          installments_count: number
          payment_method_id: string
          total_amount_cents: number
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          category_id: string
          created_at?: string
          credit_card_id?: string | null
          description: string
          first_due_date: string
          id?: string
          installments_count: number
          payment_method_id: string
          total_amount_cents: number
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          category_id?: string
          created_at?: string
          credit_card_id?: string | null
          description?: string
          first_due_date?: string
          id?: string
          installments_count?: number
          payment_method_id?: string
          total_amount_cents?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "installment_plans_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installment_plans_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installment_plans_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installment_plans_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          id: string
          payload: Json
          read_at: string | null
          scheduled_for: string
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body: string
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          payload?: Json
          read_at?: string | null
          scheduled_for?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          payload?: Json
          read_at?: string | null
          scheduled_for?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          account_id: string | null
          created_at: string
          credit_card_id: string | null
          id: string
          is_active: boolean
          name: string
          type: Database["public"]["Enums"]["payment_method_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          credit_card_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          type: Database["public"]["Enums"]["payment_method_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          created_at?: string
          credit_card_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          type?: Database["public"]["Enums"]["payment_method_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_methods_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          base_currency: string
          created_at: string
          full_name: string | null
          id: string
          locale: string
          pin_failed_attempts: number
          pin_hash: string | null
          pin_locked_until: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          base_currency?: string
          created_at?: string
          full_name?: string | null
          id: string
          locale?: string
          pin_failed_attempts?: number
          pin_hash?: string | null
          pin_locked_until?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          base_currency?: string
          created_at?: string
          full_name?: string | null
          id?: string
          locale?: string
          pin_failed_attempts?: number
          pin_hash?: string | null
          pin_locked_until?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recurring_rules: {
        Row: {
          account_id: string
          amount_cents: number
          category_id: string
          created_at: string
          description: string
          end_date: string | null
          end_type: Database["public"]["Enums"]["recurrence_end_type"]
          frequency: Database["public"]["Enums"]["recurrence_frequency"]
          id: string
          interval: number
          is_active: boolean
          kind: Database["public"]["Enums"]["recurrence_kind"]
          next_run_date: string
          occurrences_generated: number
          occurrences_total: number | null
          payment_method_id: string
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount_cents: number
          category_id: string
          created_at?: string
          description: string
          end_date?: string | null
          end_type: Database["public"]["Enums"]["recurrence_end_type"]
          frequency: Database["public"]["Enums"]["recurrence_frequency"]
          id?: string
          interval?: number
          is_active?: boolean
          kind: Database["public"]["Enums"]["recurrence_kind"]
          next_run_date: string
          occurrences_generated?: number
          occurrences_total?: number | null
          payment_method_id: string
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount_cents?: number
          category_id?: string
          created_at?: string
          description?: string
          end_date?: string | null
          end_type?: Database["public"]["Enums"]["recurrence_end_type"]
          frequency?: Database["public"]["Enums"]["recurrence_frequency"]
          id?: string
          interval?: number
          is_active?: boolean
          kind?: Database["public"]["Enums"]["recurrence_kind"]
          next_run_date?: string
          occurrences_generated?: number
          occurrences_total?: number | null
          payment_method_id?: string
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_rules_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_rules_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount_cents: number
          card_invoice_id: string | null
          category_id: string
          created_at: string
          description: string | null
          external_ref: string | null
          id: string
          installment_number: number | null
          installment_plan_id: string | null
          kind: Database["public"]["Enums"]["transaction_kind"]
          payment_method_id: string
          recurring_rule_id: string | null
          source: Database["public"]["Enums"]["transaction_source"]
          status: Database["public"]["Enums"]["transaction_status"]
          transaction_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount_cents: number
          card_invoice_id?: string | null
          category_id: string
          created_at?: string
          description?: string | null
          external_ref?: string | null
          id?: string
          installment_number?: number | null
          installment_plan_id?: string | null
          kind: Database["public"]["Enums"]["transaction_kind"]
          payment_method_id: string
          recurring_rule_id?: string | null
          source?: Database["public"]["Enums"]["transaction_source"]
          status?: Database["public"]["Enums"]["transaction_status"]
          transaction_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount_cents?: number
          card_invoice_id?: string | null
          category_id?: string
          created_at?: string
          description?: string | null
          external_ref?: string | null
          id?: string
          installment_number?: number | null
          installment_plan_id?: string | null
          kind?: Database["public"]["Enums"]["transaction_kind"]
          payment_method_id?: string
          recurring_rule_id?: string | null
          source?: Database["public"]["Enums"]["transaction_source"]
          status?: Database["public"]["Enums"]["transaction_status"]
          transaction_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_card_invoice_id_fkey"
            columns: ["card_invoice_id"]
            isOneToOne: false
            referencedRelation: "card_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_installment_plan_id_fkey"
            columns: ["installment_plan_id"]
            isOneToOne: false
            referencedRelation: "installment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_recurring_rule_id_fkey"
            columns: ["recurring_rule_id"]
            isOneToOne: false
            referencedRelation: "recurring_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      webauthn_challenges: {
        Row: {
          challenge: string
          created_at: string
          user_id: string
        }
        Insert: {
          challenge: string
          created_at?: string
          user_id: string
        }
        Update: {
          challenge?: string
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      webauthn_credentials: {
        Row: {
          created_at: string
          credential_id: string
          device_label: string | null
          id: string
          last_used_at: string | null
          public_key: string
          sign_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          credential_id: string
          device_label?: string | null
          id?: string
          last_used_at?: string | null
          public_key: string
          sign_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          credential_id?: string
          device_label?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string
          sign_count?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_category_breakdown: {
        Row: {
          amount_cents: number | null
          category_color: string | null
          category_icon: string | null
          category_id: string | null
          category_name: string | null
          month: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      v_monthly_summary: {
        Row: {
          balance_cents: number | null
          expense_cents: number | null
          income_cents: number | null
          month: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calc_next_recurrence_date: {
        Args: {
          p_end_date: string
          p_end_type: Database["public"]["Enums"]["recurrence_end_type"]
          p_frequency: Database["public"]["Enums"]["recurrence_frequency"]
          p_from_date: string
          p_interval: number
          p_occurrences_generated: number
          p_occurrences_total: number
          p_start_date: string
        }
        Returns: string
      }
      fn_check_budget_alerts: { Args: never; Returns: undefined }
      fn_check_fixed_bill_alerts: { Args: never; Returns: undefined }
      fn_close_due_invoices: { Args: never; Returns: undefined }
      fn_generate_recurring_transactions: { Args: never; Returns: undefined }
      get_or_create_card_invoice: {
        Args: { p_credit_card_id: string; p_transaction_date: string }
        Returns: string
      }
      resolve_invoice_period: {
        Args: {
          p_closing_day: number
          p_due_day: number
          p_transaction_date: string
        }
        Returns: Record<string, unknown>
      }
      set_pin: { Args: { p_pin: string }; Returns: undefined }
      verify_pin: { Args: { p_pin: string }; Returns: boolean }
    }
    Enums: {
      account_type: "checking" | "savings" | "wallet" | "investment"
      budget_kind: "flexible" | "fixed"
      card_invoice_status: "open" | "closed" | "paid" | "overdue"
      category_kind: "income" | "expense"
      goal_status: "active" | "completed" | "archived"
      notification_channel: "push" | "email" | "in_app"
      notification_status: "pending" | "sent" | "failed" | "read"
      notification_type:
        | "budget_alert"
        | "bill_due"
        | "goal_progress"
        | "invoice_closed"
        | "system"
      payment_method_type:
        | "pix"
        | "debit_card"
        | "credit_card"
        | "boleto"
        | "cash"
      recurrence_end_type: "date" | "occurrences" | "infinite"
      recurrence_frequency: "daily" | "weekly" | "monthly" | "yearly"
      recurrence_kind: "income" | "expense"
      transaction_kind: "income" | "expense" | "transfer"
      transaction_source: "manual" | "audio" | "ocr" | "import" | "openfinance"
      transaction_status: "pending" | "cleared" | "reconciled"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      account_type: ["checking", "savings", "wallet", "investment"],
      budget_kind: ["flexible", "fixed"],
      card_invoice_status: ["open", "closed", "paid", "overdue"],
      category_kind: ["income", "expense"],
      goal_status: ["active", "completed", "archived"],
      notification_channel: ["push", "email", "in_app"],
      notification_status: ["pending", "sent", "failed", "read"],
      notification_type: [
        "budget_alert",
        "bill_due",
        "goal_progress",
        "invoice_closed",
        "system",
      ],
      payment_method_type: [
        "pix",
        "debit_card",
        "credit_card",
        "boleto",
        "cash",
      ],
      recurrence_end_type: ["date", "occurrences", "infinite"],
      recurrence_frequency: ["daily", "weekly", "monthly", "yearly"],
      recurrence_kind: ["income", "expense"],
      transaction_kind: ["income", "expense", "transfer"],
      transaction_source: ["manual", "audio", "ocr", "import", "openfinance"],
      transaction_status: ["pending", "cleared", "reconciled"],
    },
  },
} as const

