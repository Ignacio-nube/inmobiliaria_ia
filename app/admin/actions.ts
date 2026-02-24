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
    revalidatePath("/propiedades");
    revalidatePath("/");
}

export async function updateSiteSettings(formData: FormData) {
    const supabase = await createClient();

    const settings = {
        hero_title: formData.get("hero_title") as string,
        hero_subtitle: formData.get("hero_subtitle") as string,
        hero_image_url: formData.get("hero_image_url") as string || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop",
        primary_color: formData.get("primary_color") as string,
        accent_color: formData.get("accent_color") as string,
        property_card_style: formData.get("property_card_style") as string,
        font_heading: formData.get("font_heading") as string,
        updated_at: new Date().toISOString()
    };

    // We only have one row, so let's fetch its ID first just to be safe
    const { data } = await supabase.from('site_settings').select('id').limit(1).single();
    if (data) {
        const { error } = await supabase
            .from("site_settings")
            .update(settings)
            .eq("id", data.id);

        if (error) throw new Error(error.message);
    }

    // Revalidate everything since settings affect global layout
    revalidatePath("/", "layout");
}

export async function markMessageRead(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("contacts")
        .update({ status: 'read' })
        .eq("id", id);

    if (error) throw new Error(error.message);
    revalidatePath("/admin/mensajes");
}

export async function deleteMessage(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", id);

    if (error) throw new Error(error.message);
    revalidatePath("/admin/mensajes");
}
