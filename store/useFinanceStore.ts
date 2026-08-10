import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface Transaction {
  id: string;
  amount: number;
  type: "credit" | "debit" | "transfer";
  categoryType: string;
  bankId: string;
  targetBankId?: string;
  refNote: string;
  dateTime: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  isPrimary: boolean;
}

export interface CustomCategory {
  id: string;
  name: string;
  icon: string;
  bg: string;
  text: string;
}

interface FinanceState {
  transactions: Transaction[];
  banks: BankAccount[];
  categories: CustomCategory[];

  getBalance: (bankId: string) => number;
  getNetBalance: () => number;
  getTodayStats: (bankId?: string) => { credited: number; debited: number };

  addBank: (bankName: string) => void;
  setPrimaryBank: (bankId: string) => void;

  addCategory: (name: string, icon?: string) => void;
  deleteCategory: (categoryId: string) => void;

  addTransaction: (
    transaction: Omit<Transaction, "id" | "dateTime"> & { dateTime?: string },
  ) => void;
  deleteTransaction: (id: string) => void;
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      banks: [],
      transactions: [],
      categories: [
        {
          id: "cat-1",
          name: "Salary",
          icon: "wallet",
          bg: "bg-emerald-500/10",
          text: "text-emerald-400",
        },
        {
          id: "cat-2",
          name: "Food",
          icon: "fast-food",
          bg: "bg-orange-500/10",
          text: "text-orange-400",
        },
        {
          id: "cat-3",
          name: "Shopping",
          icon: "basket",
          bg: "bg-pink-500/10",
          text: "text-pink-400",
        },
        {
          id: "cat-4",
          name: "Entertainment",
          icon: "game-controller",
          bg: "bg-red-500/10",
          text: "text-red-400",
        },
        {
          id: "cat-5",
          name: "Fuel",
          icon: "car",
          bg: "bg-blue-500/10",
          text: "text-blue-400",
        },
        {
          id: "cat-6",
          name: "Bills",
          icon: "receipt",
          bg: "bg-purple-500/10",
          text: "text-purple-400",
        },
        {
          id: "cat-7",
          name: "Medical",
          icon: "medical",
          bg: "bg-rose-500/10",
          text: "text-rose-400",
        },
        {
          id: "cat-default",
          name: "Others",
          icon: "ellipsis-horizontal",
          bg: "bg-slate-500/10",
          text: "text-slate-400",
        },
      ],

      getBalance: (bankId: string) => {
        const { transactions } = get();
        return transactions.reduce((balance, tx) => {
          if (tx.bankId === bankId && tx.type === "credit")
            return balance + tx.amount;
          if (tx.bankId === bankId && tx.type === "debit")
            return balance - tx.amount;
          if (tx.type === "transfer" && tx.bankId === bankId)
            return balance - tx.amount;
          if (tx.type === "transfer" && tx.targetBankId === bankId)
            return balance + tx.amount;
          return balance;
        }, 0);
      },

      getNetBalance: () => {
        const { banks, getBalance } = get();
        return banks.reduce((total, bank) => total + getBalance(bank.id), 0);
      },

      getTodayStats: (bankId) => {
        const { transactions } = get();

        const todayStr = new Date().toDateString();

        return transactions.reduce(
          (stats, tx) => {
            const isToday = new Date(tx.dateTime).toDateString() === todayStr;
            if (!isToday) return stats;

            const isTargetBank =
              !bankId || tx.bankId === bankId || tx.targetBankId === bankId;
            if (!isTargetBank) return stats;

            if (tx.type === "credit" && (!bankId || tx.bankId === bankId)) {
              stats.credited += tx.amount;
            } else if (
              tx.type === "debit" &&
              (!bankId || tx.bankId === bankId)
            ) {
              stats.debited += tx.amount;
            } else if (tx.type === "transfer") {
              if (bankId && tx.targetBankId === bankId)
                stats.credited += tx.amount;
              if (bankId && tx.bankId === bankId) stats.debited += tx.amount;
            }

            return stats;
          },
          { credited: 0, debited: 0 },
        );
      },

      addBank: (bankName) =>
        set((state) => {
          const formattedName = bankName.trim().toUpperCase();
          if (state.banks.some((b) => b.bankName === formattedName))
            return state;

          return {
            banks: [
              ...state.banks,
              {
                id: `bank-${Math.random().toString(36).substring(2, 9)}`,
                bankName: formattedName,
                isPrimary: state.banks.length === 0,
              },
            ],
          };
        }),

      setPrimaryBank: (bankId) =>
        set((state) => ({
          banks: state.banks.map((b) => ({
            ...b,
            isPrimary: b.id === bankId,
          })),
        })),

      addCategory: (name, icon = "ellipsis-horizontal") =>
        set((state) => {
          const formattedName = name.trim();
          if (
            state.categories.some(
              (c) => c.name.toLowerCase() === formattedName.toLowerCase(),
            )
          )
            return state;

          const colorPalettes = [
            { bg: "bg-blue-500/10", text: "text-blue-400" },
            { bg: "bg-purple-500/10", text: "text-purple-400" },
            { bg: "bg-rose-500/10", text: "text-rose-400" },
            { bg: "bg-cyan-500/10", text: "text-cyan-400" },
          ];

          const colorPicked =
            colorPalettes[state.categories.length % colorPalettes.length];

          const newCategory: CustomCategory = {
            id: `cat-${Math.random().toString(36).substring(2, 9)}`,
            name: formattedName,
            icon: icon,
            ...colorPicked,
          };

          return { categories: [...state.categories, newCategory] };
        }),

      deleteCategory: (categoryId) =>
        set((state) => {
          if (categoryId === "cat-default") return state;

          const targetCategory = state.categories.find(
            (c) => c.id === categoryId,
          );
          if (!targetCategory) return state;

          return {
            categories: state.categories.filter((c) => c.id !== categoryId),
            transactions: state.transactions.map((tx) => {
              if (
                tx.categoryType.toLowerCase() ===
                targetCategory.name.toLowerCase()
              ) {
                return { ...tx, categoryType: "Others" };
              }
              return tx;
            }),
          };
        }),

      addTransaction: (newTx) =>
        set((state) => ({
          transactions: [
            {
              ...newTx,
              id: `tx-${Math.random().toString(36).substring(2, 9)}`,
              dateTime: newTx.dateTime || new Date().toISOString(),
            },
            ...state.transactions,
          ],
        })),

      deleteTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((tx) => tx.id !== id),
        })),
    }),
    {
      name: "finance-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
