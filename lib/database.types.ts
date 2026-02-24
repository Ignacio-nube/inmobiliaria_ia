export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            agencies: {
                Row: {
                    id: string
                    name: string
                    contact_email: string
                    phone: string | null
                    logo_url: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    contact_email: string
                    phone?: string | null
                    logo_url?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    contact_email?: string
                    phone?: string | null
                    logo_url?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            properties: {
                Row: {
                    id: string
                    title: string
                    description: string
                    price: number
                    currency: string
                    location: string
                    property_type: string
                    bedrooms: number | null
                    bathrooms: number | null
                    square_meters: number | null
                    images: string[]
                    created_at: string
                    agency_id: string | null
                    published: boolean
                    is_featured: boolean
                }
                Insert: {
                    id?: string
                    title: string
                    description: string
                    price: number
                    currency?: string
                    location: string
                    property_type: string
                    bedrooms?: number | null
                    bathrooms?: number | null
                    square_meters?: number | null
                    images?: string[]
                    created_at?: string
                    agency_id?: string | null
                    published?: boolean
                    is_featured?: boolean
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string
                    price?: number
                    currency?: string
                    location?: string
                    property_type?: string
                    bedrooms?: number | null
                    bathrooms?: number | null
                    square_meters?: number | null
                    images?: string[]
                    created_at?: string
                    agency_id?: string | null
                    published?: boolean
                    is_featured?: boolean
                }
                Relationships: [
                    {
                        foreignKeyName: "properties_agency_id_fkey"
                        columns: ["agency_id"]
                        referencedRelation: "agencies"
                        referencedColumns: ["id"]
                    }
                ]
            }
            site_settings: {
                Row: {
                    id: string
                    hero_title: string
                    hero_subtitle: string
                    primary_color: string
                    accent_color: string
                    font_heading: string
                    updated_at: string
                    property_card_style: string
                    hero_image_url: string
                }
                Insert: {
                    id?: string
                    hero_title?: string
                    hero_subtitle?: string
                    primary_color?: string
                    accent_color?: string
                    font_heading?: string
                    updated_at?: string
                    property_card_style?: string
                    hero_image_url?: string
                }
                Update: {
                    id?: string
                    hero_title?: string
                    hero_subtitle?: string
                    primary_color?: string
                    accent_color?: string
                    font_heading?: string
                    updated_at?: string
                    property_card_style?: string
                    hero_image_url?: string
                }
                Relationships: []
            }
            contacts: {
                Row: {
                    id: string
                    property_id: string | null
                    property_title: string | null
                    name: string
                    phone: string
                    message: string
                    status: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    property_id?: string | null
                    property_title?: string | null
                    name: string
                    phone: string
                    message: string
                    status?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    property_id?: string | null
                    property_title?: string | null
                    name?: string
                    phone?: string
                    message?: string
                    status?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "contacts_property_id_fkey"
                        columns: ["property_id"]
                        referencedRelation: "properties"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
