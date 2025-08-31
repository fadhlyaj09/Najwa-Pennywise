"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Category } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters."),
  type: z.enum(['income', 'expense'], { required_error: "Please select a category type." }),
});

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (category: Omit<Category, 'id' | 'isDefault'>) => void;
  onDeleteCategory: (id: string) => void;
}

export default function CategoryManager({ categories, onAddCategory, onDeleteCategory }: CategoryManagerProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", type: "expense" },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onAddCategory({ name: values.name, icon: 'Tag', type: values.type });
    form.reset();
  }

  const sortedCategories = [...categories].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    if (a.type !== b.type) return a.type === 'income' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <ScrollArea className="flex-1">
      <div className="space-y-6 p-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Add New Category</h4>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Entertainment" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Category Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex gap-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="expense" />
                          </FormControl>
                          <FormLabel className="font-normal">Expense</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="income" />
                          </FormControl>
                          <FormLabel className="font-normal">Income</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">Add Category</Button>
            </form>
          </Form>
        </div>

        <Separator />

        <div>
          <h4 className="text-sm font-medium mb-2">Existing Categories</h4>
          <div className="flex flex-wrap gap-2 pb-4">
            {sortedCategories.map((cat) => (
              <Badge 
                key={cat.id} 
                variant={cat.type === 'income' ? 'default' : 'secondary'} 
                className="group relative pr-7"
              >
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
    </ScrollArea>
  );
}
