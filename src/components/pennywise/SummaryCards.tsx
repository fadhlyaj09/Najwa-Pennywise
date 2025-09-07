
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpCircle, ArrowDownCircle, Wallet, Edit, Check, Target } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils";

interface SummaryCardsProps {
  income: number;
  expenses: number;
  balance: number;
  spendingLimit: number;
  onSetSpendingLimit: (limit: number) => void;
}

const SummaryCards = ({ income, expenses, balance, spendingLimit, onSetSpendingLimit }: SummaryCardsProps) => {
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [newLimit, setNewLimit] = useState<number | string>(spendingLimit);

  const spendingProgress = spendingLimit > 0 ? (expenses / spendingLimit) * 100 : 0;
  const limitExceeded = expenses > spendingLimit;

  const handleLimitSave = () => {
    const limitAsNumber = Number(newLimit);
    if (newLimit === '' || isNaN(limitAsNumber) || limitAsNumber < 0) {
      onSetSpendingLimit(0);
    } else {
      onSetSpendingLimit(limitAsNumber);
    }
    setIsEditingLimit(false);
  }

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewLimit(e.target.value);
  };

  const getAmountFontSize = (amount: number) => {
    const amountLength = Math.abs(amount).toString().length;
    if (amountLength > 9) return 'text-lg'; // e.g. 1,000,000,000
    if (amountLength > 6) return 'text-xl'; // e.g. 1,000,000
    return 'text-2xl';
  }


  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          <ArrowUpCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className={`${getAmountFontSize(income)} font-bold`}>{formatRupiah(income, {short: true})}</div>
          <p className="text-xs text-muted-foreground">{formatRupiah(income)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <ArrowDownCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className={`${getAmountFontSize(expenses)} font-bold`}>{formatRupiah(expenses, {short: true})}</div>
           <p className="text-xs text-muted-foreground">{formatRupiah(expenses)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Balance</CardTitle>
          <Wallet className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className={`${getAmountFontSize(balance)} font-bold ${balance < 0 ? 'text-destructive' : ''}`}>{formatRupiah(balance, {short: true})}</div>
           <p className="text-xs text-muted-foreground">{formatRupiah(balance)}</p>
        </CardContent>
      </Card>
      <Card className="md:col-span-3">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground"/>
                <CardTitle className="text-sm font-medium">Spending Limit</CardTitle>
            </div>
             {isEditingLimit ? (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleLimitSave}>
                  <Check className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                    setNewLimit(spendingLimit);
                    setIsEditingLimit(true);
                }}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
          </div>
          {isEditingLimit ? (
            <Input 
              type="number"
              value={newLimit}
              onChange={handleLimitChange}
              onBlur={handleLimitSave}
              onKeyDown={(e) => e.key === 'Enter' && handleLimitSave()}
              className="mt-1 h-8 text-base"
              placeholder="Enter limit"
            />
          ) : (
            <div className="text-base font-bold">{formatRupiah(spendingLimit)}</div>
          )}
        </CardHeader>
        <CardContent className="space-y-1">
            <Progress value={spendingProgress} className={limitExceeded ? "[&>div]:bg-destructive" : ""} />
            <p className={`text-xs ${limitExceeded ? 'text-destructive' : 'text-muted-foreground'}`}>
                {limitExceeded
                ? `Limit exceeded by ${formatRupiah(expenses - spendingLimit)}`
                : `${formatRupiah(spendingLimit - expenses)} remaining`}
            </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryCards;
