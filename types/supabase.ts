export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      undian_data: {
        Row: {
          id: number;
          id_telegram: string;
          address_mon: string;
          no_pilihan: number;
        };
        Insert: {
          id_telegram: string;
          address_mon: string;
          no_pilihan: number;
        };
        Update: Partial<{
          id_telegram: string;
          address_mon: string;
          no_pilihan: number;
        }>;
      };
      settings: {
        Row: {
          id: number;
          input_limit: number;
        };
        Insert: {
          input_limit: number;
        };
        Update: {
          input_limit?: number;
        };
      };
    };
    Views: {};
    Functions: {};
  };
}
