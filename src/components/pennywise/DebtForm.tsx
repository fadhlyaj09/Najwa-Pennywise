
"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Debt } from "@/lib/types";
import { format } from "date-fns";

const formSchema = z.object({
  debtorName: z.string().min(2, { message: "Debtor name must be at least 2 characters." }),
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  description: z.string().min(3, { message: "Description must be at least 3 characters." }),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
});

interface DebtFormProps {
  onAddDebt: (debt: Omit<Debt, 'id' | 'status' | 'icon' | 'lendingTransactionId' | 'repaymentTransactionId'>) => void;
}

export default function DebtForm({ onAddDebt }: DebtFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      debtorName: "",
      amount: 0,
      description: "",
      dueDate: format(new Date(), "yyyy-MM-dd"),
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onAddDebt(values);
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="debtorName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Debtor's Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">Rp</span>
                  <Input type="number" placeholder="100000" className="pl-8" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Money for lunch" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Due Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Add Record</Button>
      </form>
    </Form>
  );
}
