import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.number()
    .min(1, "Wybierz przynajmniej 1 gwiazdkę")
    .max(5, "Maksymalna ocena to 5"),
  comment: z.string()
    .max(1000, "Komentarz może mieć maksymalnie 1000 znaków")
    .optional(),
});

export type CreateReviewData = z.infer<typeof createReviewSchema>;