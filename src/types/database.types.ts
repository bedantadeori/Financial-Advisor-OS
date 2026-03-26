export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          archived_at: string | null
          balance: number | null
          created_at: string | null
          id: string
          name: string
          type: Database["public"]["Enums"]["account_type"]
          user_id: string
          currency: Database["public"]["Enums"]["currency_type"]
          balance_in_inr: number | null
        }
        Insert: {
          archived_at?: string | null
          balance?: number | null
          created_at?: string | null
          id?: string
          name: string
          type: Database["public"]["Enums"]["account_type"]
          user_id: string
          currency?: Database["public"]["Enums"]["currency_type"]
          balance_in_inr?: number | null
        }
        Update: {
          archived_at?: string | null
          balance?: number | null
          created_at?: string | null
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["account_type"]
          user_id?: string
          currency?: Database["public"]["Enums"]["currency_type"]
          balance_in_inr?: number | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          archived_at: string | null
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      fixed_expenses: {
        Row: {
          account_id: string | null
          amount: number
          archived_at: string | null
          billing_type: Database["public"]["Enums"]["billing_type"]
          category_id: string | null
          created_at: string | null
          due_day: number | null
          id: string
          is_active: boolean
          name: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          archived_at?: string | null
          billing_type?: Database["public"]["Enums"]["billing_type"]
          category_id?: string | null
          created_at?: string | null
          due_day?: number | null
          id?: string
          is_active?: boolean
          name: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          archived_at?: string | null
          billing_type?: Database["public"]["Enums"]["billing_type"]
          category_id?: string | null
          created_at?: string | null
          due_day?: number | null
          id?: string
          is_active?: boolean
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fixed_expenses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string | null
          current_amount: number | null
          deadline: string | null
          id: string
          name: string
          target_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_amount?: number | null
          deadline?: string | null
          id?: string
          name: string
          target_amount: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_amount?: number | null
          deadline?: string | null
          id?: string
          name?: string
          target_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          description: string | null
          fixed_expense_id: string | null
          from_account_id: string | null
          goal_id: string | null
          id: string
          is_planning_income: boolean
          status: Database["public"]["Enums"]["transaction_status"]
          to_account_id: string | null
          transaction_date: string
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
          currency: Database["public"]["Enums"]["currency_type"]
          amount_in_inr: number
          exchange_rate: number
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          fixed_expense_id?: string | null
          from_account_id?: string | null
          goal_id?: string | null
          id?: string
          is_planning_income?: boolean
          status?: Database["public"]["Enums"]["transaction_status"]
          to_account_id?: string | null
          transaction_date: string
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
          currency?: Database["public"]["Enums"]["currency_type"]
          amount_in_inr?: number
          exchange_rate?: number
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          fixed_expense_id?: string | null
          from_account_id?: string | null
          goal_id?: string | null
          id?: string
          is_planning_income?: boolean
          status?: Database["public"]["Enums"]["transaction_status"]
          to_account_id?: string | null
          transaction_date?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
          currency?: Database["public"]["Enums"]["currency_type"]
          amount_in_inr?: number
          exchange_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_fixed_expense_id_fkey"
            columns: ["fixed_expense_id"]
            isOneToOne: false
            referencedRelation: "fixed_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_from_account_id_fkey"
            columns: ["from_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      cc_monthly_bills: {
        Row: {
          bill_amount: number | null
          credit_card_id: string
          credit_card_name: string | null
          due_date: string | null
          statement_date: string
          user_id: string
          status: Database["public"]["Enums"]["bill_status"]
        }
        Insert: {
          bill_amount?: number | null
          credit_card_id: string
          credit_card_name?: string | null
          due_date?: string | null
          statement_date: string
          user_id: string
          status?: Database["public"]["Enums"]["bill_status"]
        }
        Update: {
          bill_amount?: number | null
          credit_card_id?: string
          credit_card_name?: string | null
          due_date?: string | null
          statement_date?: string
          user_id?: string
          status?: Database["public"]["Enums"]["bill_status"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_from_account_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      bank_upcoming_debits: {
        Row: {
          account_name: string | null
          amount: number | null
          category_name: string | null
          due_day: number | null
          fixed_expense_id: string | null
          name: string | null
          next_deduction_date: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fixed_expenses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cc_transaction_details: {
        Row: {
          amount: number | null
          category_name: string | null
          credit_card_id: string | null
          credit_card_name: string | null
          description: string | null
          due_date: string | null
          statement_date: string | null
          status: Database["public"]["Enums"]["transaction_status"] | null
          transaction_date: string | null
          transaction_id: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_from_account_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      inject_monthly_fixed_expenses: { Args: never; Returns: undefined }
      mark_cc_bill_paid: {
        Args: {
          p_credit_card_id: string
          p_statement_date: string
        }
        Returns: undefined
      }
    }
    Enums: {
      account_type: "bank" | "credit_card" | "cash"
      billing_type: "bank" | "cc"
      transaction_status: "posted" | "pending"
      bill_status: "paid" | "pending"
      transaction_type: "income" | "expense" | "transfer"
      currency_type: "INR" | "USD" | "VND"
    }
  }
}
