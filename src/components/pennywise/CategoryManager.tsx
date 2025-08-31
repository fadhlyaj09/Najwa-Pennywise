"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Category } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters."),
});

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (category: Omit<Category, 'id' | 'isDefault'>) => void;
  onDeleteCategory: (id: string) => void;
}

export default function CategoryManager({ categories, onAddCategory, onDeleteCategory }: CategoryManagerProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "" },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onAddCategory({ name: values.name, icon: 'Tag' });
    form.reset();
  }

  const sortedCategories = [...categories].sort((a, b) => {
      if (a.name === 'Salary') return -1;
      if (b.name === 'Salary') return 1;
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return a.name.localeCompare(b.name);
  });

  return (
    <ScrollArea className="h-full">
      <div className="p-4 pt-0">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Add New Category</h4>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormControl>
                        <Input placeholder="e.g., Entertainment" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Add</Button>
              </form>
            </Form>
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-medium mb-2">Existing Categories</h4>
            <div className="flex flex-wrap gap-2 pb-4">
              {sortedCategories.map((cat) => (
                <Badge key={cat.id} variant="secondary" className="group relative pr-7">
                  {cat.name}
                  {!cat.isDefault && (
                     <button
                      onClick={() => onDeleteCategory(cat.id)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-0.5 bg-muted-foreground/20 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
                      aria-label={`Delete ${cat.name}`}
                     >
                         <X className="h-3 w-3" />
                     </button>
                  )}
                </Badge>
              ))}
              {sortedCategories.length === 0 && (
                <p className="text-sm text-muted-foreground w-full text-center py-4">No categories added yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
