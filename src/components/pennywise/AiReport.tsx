
"use client";

import { useState, useMemo } from 'react';
import { Bot, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { generateMonthlyReportAction } from '@/lib/actions';
import type { Transaction } from '@/lib/types';

interface AiReportProps {
    transactions: Transaction[];
    spendingLimit: number;
    income: number;
    expenses: number;
}

const AiReport = ({ transactions, spendingLimit, income, expenses }: AiReportProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [report, setReport] = useState<string | null>(null);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const { toast } = useToast();

    const spendingByCategory = useMemo(() => {
        return transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + t.amount;
                return acc;
            }, {} as Record<string, number>);
    }, [transactions]);


    const handleGenerateReport = async () => {
        setIsLoading(true);
        setReport(null);

        const result = await generateMonthlyReportAction(
            income,
            expenses,
            spendingByCategory,
            spendingLimit,
            transactions,
        );
        
        setIsLoading(false);
        if(result.success && result.report) {
            setReport(result.report);
            setIsReportOpen(true);
        } else {
            toast({
                variant: "destructive",
                title: "Error",
                description: result.error || "Could not generate the report."
            });
        }
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>AI Monthly Report</CardTitle>
                    <CardDescription>Get AI-powered insights on your spending habits.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleGenerateReport} disabled={isLoading || transactions.length === 0} className="w-full">
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Bot className="mr-2 h-4 w-4" />
                        )}
                        Generate Report
                    </Button>
                    {transactions.length === 0 && (
                        <p className="text-xs text-center text-muted-foreground mt-2">Add transactions to enable.</p>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Your AI Financial Report</DialogTitle>
                        <DialogDescription>
                            Here are the insights based on your recent activity.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[60vh] pr-4">
                        <div className="text-sm text-foreground space-y-4" dangerouslySetInnerHTML={{ __html: report || "" }} />
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default AiReport;

    