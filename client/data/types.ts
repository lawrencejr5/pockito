type AntIconType = "caretup" | "caretdown";

export const types: {
  type: "credit" | "debit";
  color: string;
  icon: AntIconType;
}[] = [
  { type: "credit", color: "green", icon: "caretup" },
  { type: "debit", color: "red", icon: "caretdown" },
];
