"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Category } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters."),
});

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (category: Omit<Category, 'id'>) => void;
}

export default function CategoryManager({ categories, onAddCategory }: CategoryManagerProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "" },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onAddCategory({ name: values.name, icon: 'Tag' }); // Default icon
    form.reset();
  }

  // Sort categories alphabetically, but keep "Salary" at the top
  const sortedCategories = [...categories].sort((a, b) => {
      if (a.name === 'Salary') return -1;
      if (b.name === 'Salary') return 1;
      return a.name.localeCompare(b.name);
  });

  return (
    <div className="flex flex-col h-full">
        <div className="mb-4">
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

        <Separator className="mb-4" />
        
        <div className="flex-1 min-h-0">
            <h4 className="text-sm font-medium mb-2">Existing Categories</h4>
            <ScrollArea className="h-full pr-4">
                <div className="flex flex-wrap gap-2 pb-4">
                    {sortedCategories.map((cat) => (
                    <Badge key={cat.id} variant="secondary">{cat.name}</Badge>
                    ))}
                    {sortedCategories.length === 0 && (
                    <p className="text-sm text-muted-foreground w-full text-center py-4">No categories added yet.</p>
                    )}
                </div>
            </ScrollArea>
        </div>
    </div>
  );
}
