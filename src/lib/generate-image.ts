import { supabase } from "@/utils/supabase/client";

export const getRandomImageUrl = () => {
  const randomNum = Math.floor(Math.random() * 25); // 0 to 24
  const imageName = `aibtcdev_pattern_1_tiles_${randomNum}.jpg`;
  return `${
    supabase.storage.from("agent-image").getPublicUrl(imageName).data.publicUrl
  }`;
};
