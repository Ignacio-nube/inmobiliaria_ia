"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function togglePropertyPublish(id: string, currentlyPublished: boolean) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("properties")
        .update({ published: !currentlyPublished })
        .eq("id", id);

    if (error) throw new Error(error.message);
    revalidatePath("/admin");
    revalidatePath("/admin/propiedades");
    revalidatePath("/propiedades");
    revalidatePath("/");
}

export async function togglePropertyFeature(id: string, currentlyFeatured: boolean) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("properties")
        .update({ is_featured: !currentlyFeatured })
        .eq("id", id);

    if (error) throw new Error(error.message);
    revalidatePath("/admin");
    revalidatePath("/admin/propiedades");
    revalidatePath("/");
}

export async function deleteProperty(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", id);

    if (error) throw new Error(error.message);
    revalidatePath("/admin");
    revalidatePath("/admin/propiedades");
    revalidatePath("/propiedades");
    revalidatePath("/");
}

export async function approveProperty(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("properties")
        .update({ approval_status: 'approved', published: true })
        .eq("id", id);

    if (error) throw new Error(error.message);
    revalidatePath("/admin");
    revalidatePath("/admin/propiedades");
    revalidatePath("/propiedades");
    revalidatePath("/");
}

export async function rejectProperty(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("properties")
        .update({ approval_status: 'rejected', published: false })
        .eq("id", id);

    if (error) throw new Error(error.message);
    revalidatePath("/admin");
    revalidatePath("/admin/propiedades");
}

export async function bulkApproveProperties(ids: string[]) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("properties")
        .update({ approval_status: 'approved', published: true })
        .in("id", ids);

    if (error) throw new Error(error.message);
    revalidatePath("/admin");
    revalidatePath("/admin/propiedades");
    revalidatePath("/propiedades");
    revalidatePath("/");
    return { count: ids.length };
}

export async function bulkRejectProperties(ids: string[]) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("properties")
        .update({ approval_status: 'rejected', published: false })
        .in("id", ids);

    if (error) throw new Error(error.message);
    revalidatePath("/admin");
    revalidatePath("/admin/propiedades");
    return { count: ids.length };
}

export async function bulkDeleteProperties(ids: string[]) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("properties")
        .delete()
        .in("id", ids);

    if (error) throw new Error(error.message);
    revalidatePath("/admin");
    revalidatePath("/admin/propiedades");
    revalidatePath("/propiedades");
    revalidatePath("/");
    return { count: ids.length };
}

export async function bulkToggleFeature(ids: string[], featured: boolean) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("properties")
        .update({ is_featured: featured })
        .in("id", ids);

    if (error) throw new Error(error.message);
    revalidatePath("/admin");
    revalidatePath("/admin/propiedades");
    revalidatePath("/");
    return { count: ids.length };
}

export async function markAllMessagesRead() {
    const supabase = await createClient();
    const { error } = await supabase
        .from("contacts")
        .update({ status: 'read' })
        .eq("status", "new");

    if (error) throw new Error(error.message);
    revalidatePath("/admin/mensajes");
    revalidatePath("/admin");
}

export async function updateSiteSettings(formData: FormData) {
    const supabase = await createClient();

    const heroImageFile = formData.get("hero_image_file") as File | null;
    let heroImageUrl = formData.get("hero_image_url") as string;

    // Handle Image Upload to Supabase Storage
    if (heroImageFile && heroImageFile.size > 0 && heroImageFile.name !== 'undefined') {
        const fileExt = heroImageFile.name.split('.').pop();
        const fileName = `hero_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('public-assets')
            .upload(fileName, heroImageFile, {
                cacheControl: '3600',
                upsert: true
            });

        if (uploadError) {
            console.error("Storage upload error:", uploadError);
            throw new Error(`Error subiendo imagen: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
            .from('public-assets')
            .getPublicUrl(fileName);

        heroImageUrl = publicUrlData.publicUrl;
    }

    const settings = {
        hero_title: formData.get("hero_title") as string,
        hero_subtitle: formData.get("hero_subtitle") as string,
        hero_image_url: heroImageUrl || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop",
        primary_color: formData.get("primary_color") as string,
        accent_color: formData.get("accent_color") as string,
        property_card_style: formData.get("property_card_style") as string,
        font_heading: formData.get("font_heading") as string,
        contact_email: formData.get("contact_email") as string || null,
        contact_phone: formData.get("contact_phone") as string || null,
        contact_address: formData.get("contact_address") as string || null,
        social_instagram: formData.get("social_instagram") as string || null,
        social_facebook: formData.get("social_facebook") as string || null,
        social_twitter: formData.get("social_twitter") as string || null,
        updated_at: new Date().toISOString()
    };

    const { data, error: fetchError } = await supabase.from('site_settings').select('id').limit(1).single();

    if (fetchError) {
        throw new Error(`Error fetching settings: ${fetchError.message}`);
    }

    if (!data) {
        throw new Error("No settings row found in database.");
    }

    const { error: updateError } = await supabase
        .from("site_settings")
        .update(settings)
        .eq("id", data.id);

    if (updateError) {
        throw new Error(updateError.message);
    }

    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/propiedades");
    revalidatePath("/contacto");
    revalidatePath("/publicar");
    revalidatePath("/admin");
    revalidatePath("/admin/settings");
}

export async function markMessageRead(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("contacts")
        .update({ status: 'read' })
        .eq("id", id);

    if (error) throw new Error(error.message);
    revalidatePath("/admin/mensajes");
    revalidatePath("/admin");
}

export async function deleteMessage(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", id);

    if (error) throw new Error(error.message);
    revalidatePath("/admin/mensajes");
    revalidatePath("/admin");
}
