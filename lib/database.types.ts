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
                    approval_status: string
                    latitude: number | null
                    longitude: number | null
                    address: string | null
                    neighborhood: string | null
                    city: string
                    province: string
                    operation_type: string
                    year_built: number | null
                    garage: number | null
                    amenities: string[]
                    lot_meters: number | null
                    condition: string
                    expenses: number | null
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
                    approval_status?: string
                    latitude?: number | null
                    longitude?: number | null
                    address?: string | null
                    neighborhood?: string | null
                    city?: string
                    province?: string
                    operation_type?: string
                    year_built?: number | null
                    garage?: number | null
                    amenities?: string[]
                    lot_meters?: number | null
                    condition?: string
                    expenses?: number | null
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
                    approval_status?: string
                    latitude?: number | null
                    longitude?: number | null
                    address?: string | null
                    neighborhood?: string | null
                    city?: string
                    province?: string
                    operation_type?: string
                    year_built?: number | null
                    garage?: number | null
                    amenities?: string[]
                    lot_meters?: number | null
                    condition?: string
                    expenses?: number | null
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
            contacts: {
                Row: {
                    id: string
                    name: string
                    phone: string
                    message: string
                    property_id: string | null
                    property_title: string | null
                    inquiry_type: string | null
                    status: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    phone: string
                    message: string
                    property_id?: string | null
                    property_title?: string | null
                    inquiry_type?: string | null
                    status?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    phone?: string
                    message?: string
                    property_id?: string | null
                    property_title?: string | null
                    inquiry_type?: string | null
                    status?: string | null
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
                    hero_image_url: string | null
                    contact_email: string | null
                    contact_phone: string | null
                    contact_address: string | null
                    social_instagram: string | null
                    social_facebook: string | null
                    social_twitter: string | null
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
                    hero_image_url?: string | null
                    contact_email?: string | null
                    contact_phone?: string | null
                    contact_address?: string | null
                    social_instagram?: string | null
                    social_facebook?: string | null
                    social_twitter?: string | null
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
                    hero_image_url?: string | null
                    contact_email?: string | null
                    contact_phone?: string | null
                    contact_address?: string | null
                    social_instagram?: string | null
                    social_facebook?: string | null
                    social_twitter?: string | null
                }
                Relationships: []
            }
            page_views: {
                Row: {
                    id: string
                    page_path: string
                    property_id: string | null
                    search_query: string | null
                    referrer: string | null
                    visitor_hash: string
                    user_agent: string | null
                    viewed_at: string
                }
                Insert: {
                    id?: string
                    page_path: string
                    property_id?: string | null
                    search_query?: string | null
                    referrer?: string | null
                    visitor_hash: string
                    user_agent?: string | null
                    viewed_at?: string
                }
                Update: {
                    id?: string
                    page_path?: string
                    property_id?: string | null
                    search_query?: string | null
                    referrer?: string | null
                    visitor_hash?: string
                    user_agent?: string | null
                    viewed_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "page_views_property_id_fkey"
                        columns: ["property_id"]
                        referencedRelation: "properties"
                        referencedColumns: ["id"]
                    }
                ]
            }
            search_logs: {
                Row: {
                    id: string
                    query: string
                    filters: Json | null
                    results_count: number | null
                    visitor_hash: string
                    searched_at: string
                }
                Insert: {
                    id?: string
                    query: string
                    filters?: Json | null
                    results_count?: number | null
                    visitor_hash: string
                    searched_at?: string
                }
                Update: {
                    id?: string
                    query?: string
                    filters?: Json | null
                    results_count?: number | null
                    visitor_hash?: string
                    searched_at?: string
                }
                Relationships: []
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
