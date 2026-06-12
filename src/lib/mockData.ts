export type ClientStatus = "Fechado" | "Pendente" | "Em andamento";

export interface ClientRow {
  id: string;
  name: string;
  owner: string;
  banks: string[];
  balance: number;
  revenue: number;
  expenses: number;
  status: ClientStatus;
  lastUpload: string;
  pendingCount: number;
}

export interface Transaction {
  id: string;
  clientId: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  bank: string;
  status: "pending" | "classified" | "approved";
  isRecurring: boolean;
  rawDescription?: string;
}

export const clients: ClientRow[] = [
  {
    id: "a1b2c3d4-0001-0000-0000-000000000001",
    name: "Padaria São Jorge",
    owner: "Marcos Pereira",
    banks: ["Itaú", "Santander"],
    balance: 48230.55,
    revenue: 92400,
    expenses: 71850,
    status: "Fechado",
    lastUpload: "18/04",
    pendingCount: 0,
  },
  {
    id: "a1b2c3d4-0002-0000-0000-000000000002",
    name: "Restaurante Pernambuco",
    owner: "Helena Souza",
    banks: ["Bradesco"],
    balance: 22910.12,
    revenue: 138900,
    expenses: 121400,
    status: "Em andamento",
    lastUpload: "20/04",
    pendingCount: 7,
  },
  {
    id: "a1b2c3d4-0003-0000-0000-000000000003",
    name: "Consultório Dra. Ana",
    owner: "Ana Ribeiro",
    banks: ["Inter", "Nubank"],
    balance: 86420.0,
    revenue: 64200,
    expenses: 28100,
    status: "Fechado",
    lastUpload: "19/04",
    pendingCount: 0,
  },
  {
    id: "a1b2c3d4-0004-0000-0000-000000000004",
    name: "Escritório Lima & Silva",
    owner: "Renato Lima",
    banks: ["Banco do Brasil"],
    balance: 34780.4,
    revenue: 76500,
    expenses: 64320,
    status: "Pendente",
    lastUpload: "12/04",
    pendingCount: 16,
  },
];

const buildTx = (
  clientId: string,
  date: string,
  description: string,
  amount: number,
  category: string,
  bank: string,
  status: Transaction["status"] = "approved",
  isRecurring = false,
): Transaction => ({
  id: `${clientId}-${date}-${description}`.replace(/\s+/g, "-"),
  clientId,
  date,
  description,
  amount,
  category,
  bank,
  status,
  isRecurring,
  rawDescription: description.toUpperCase() + " *PIX/TED",
});

const C1 = "a1b2c3d4-0001-0000-0000-000000000001";
const C2 = "a1b2c3d4-0002-0000-0000-000000000002";
const C3 = "a1b2c3d4-0003-0000-0000-000000000003";
const C4 = "a1b2c3d4-0004-0000-0000-000000000004";

export const transactions: Transaction[] = [
  // Padaria São Jorge
  buildTx(C1, "02/04", "Vendas balcão", 4820, "Receita · Vendas", "Itaú", "approved", true),
  buildTx(C1, "03/04", "Aluguel ponto", -6800, "Despesa Fixa · Aluguel", "Itaú", "approved", true),
  buildTx(C1, "04/04", "Folha funcionários", -18400, "Despesa Fixa · Salários", "Itaú", "approved", true),
  buildTx(C1, "05/04", "Compra farinha", -3120, "Despesa Variável · Insumos", "Santander"),
  buildTx(C1, "08/04", "iFood repasse", 9120, "Receita · Delivery", "Itaú", "approved", true),
  buildTx(C1, "10/04", "Energia Enel", -1480, "Despesa Fixa · Utilidades", "Itaú", "approved", true),
  buildTx(C1, "12/04", "Vendas semana", 12340, "Receita · Vendas", "Itaú"),
  buildTx(C1, "15/04", "Contabilidade", -890, "Despesa Fixa · Contabilidade", "Itaú", "approved", true),
  buildTx(C1, "18/04", "Manutenção forno", -2200, "Despesa Variável · Manutenção", "Santander"),

  // Restaurante Pernambuco
  buildTx(C2, "01/04", "Venda diária", 6200, "Receita · Vendas", "Bradesco"),
  buildTx(C2, "02/04", "Compra carnes", -8900, "Despesa Variável · Insumos", "Bradesco"),
  buildTx(C2, "05/04", "Folha cozinha", -22400, "Despesa Fixa · Salários", "Bradesco", "approved", true),
  buildTx(C2, "07/04", "PIX 4521", 1850, "—", "Bradesco", "pending"),
  buildTx(C2, "09/04", "DEB 887723", -640, "—", "Bradesco", "pending"),
  buildTx(C2, "10/04", "Aluguel Galeria", -9200, "Despesa Fixa · Aluguel", "Bradesco", "approved", true),
  buildTx(C2, "12/04", "TED Forneced", -4220, "—", "Bradesco", "pending"),
  buildTx(C2, "14/04", "Vendas final de semana", 18900, "Receita · Vendas", "Bradesco"),
  buildTx(C2, "16/04", "Marketing redes", -1800, "Despesa Variável · Marketing", "Bradesco"),
  buildTx(C2, "18/04", "PIX 9911", -320, "—", "Bradesco", "pending"),
  buildTx(C2, "19/04", "PIX 2230", 920, "—", "Bradesco", "pending"),
  buildTx(C2, "20/04", "DEB POSTO", -480, "—", "Bradesco", "pending"),
  buildTx(C2, "20/04", "PIX 8821", -260, "—", "Bradesco", "pending"),

  // Consultório Dra. Ana
  buildTx(C3, "03/04", "Consulta particular", 1200, "Receita · Serviços", "Inter"),
  buildTx(C3, "05/04", "Convênio Bradesco Saúde", 8200, "Receita · Convênios", "Inter", "approved", true),
  buildTx(C3, "06/04", "Aluguel sala", -3400, "Despesa Fixa · Aluguel", "Inter", "approved", true),
  buildTx(C3, "08/04", "Secretária", -3800, "Despesa Fixa · Salários", "Inter", "approved", true),
  buildTx(C3, "10/04", "Material descartável", -1240, "Despesa Variável · Insumos", "Nubank"),
  buildTx(C3, "12/04", "Convênio Sulamerica", 6800, "Receita · Convênios", "Inter", "approved", true),
  buildTx(C3, "16/04", "Curso aperfeiçoamento", -2400, "Investimento · Educação", "Nubank"),
  buildTx(C3, "19/04", "Consultas semana", 14200, "Receita · Serviços", "Inter"),

  // Escritório Lima
  buildTx(C4, "02/04", "Honorários cliente A", 12400, "Receita · Honorários", "Banco do Brasil"),
  buildTx(C4, "04/04", "Folha equipe", -28200, "Despesa Fixa · Salários", "Banco do Brasil", "approved", true),
  buildTx(C4, "06/04", "Aluguel", -4800, "Despesa Fixa · Aluguel", "Banco do Brasil", "approved", true),
  buildTx(C4, "08/04", "TED RECEB 2231", 8900, "—", "Banco do Brasil", "pending"),
  buildTx(C4, "10/04", "PIX 4498", -340, "—", "Banco do Brasil", "pending"),
  buildTx(C4, "11/04", "DEB CART 21", -1200, "—", "Banco do Brasil", "pending"),
  buildTx(C4, "12/04", "PIX 8723", -420, "—", "Banco do Brasil", "pending"),
  buildTx(C4, "12/04", "TED 9912", -2300, "—", "Banco do Brasil", "pending"),
  buildTx(C4, "13/04", "PIX RECEB 781", 4400, "—", "Banco do Brasil", "pending"),
  buildTx(C4, "14/04", "DEB POSTO", -680, "—", "Banco do Brasil", "pending"),
  buildTx(C4, "15/04", "PIX 5512", 2100, "—", "Banco do Brasil", "pending"),
  buildTx(C4, "15/04", "PIX 7782", -890, "—", "Banco do Brasil", "pending"),
  buildTx(C4, "16/04", "TED 4421", -1740, "—", "Banco do Brasil", "pending"),
  buildTx(C4, "17/04", "PIX 1198", 1320, "—", "Banco do Brasil", "pending"),
  buildTx(C4, "18/04", "DEB CART 99", -560, "—", "Banco do Brasil", "pending"),
  buildTx(C4, "19/04", "PIX 3327", -210, "—", "Banco do Brasil", "pending"),
  buildTx(C4, "19/04", "PIX 4490", -180, "—", "Banco do Brasil", "pending"),
  buildTx(C4, "20/04", "TED RECEB 8821", 7800, "—", "Banco do Brasil", "pending"),
];

export function clientById(id: string) {
  return clients.find((c) => c.id === id);
}

export function transactionsByClient(clientId: string) {
  return transactions.filter((t) => t.clientId === clientId);
}

export function pendingTransactions() {
  return transactions.filter((t) => t.status === "pending");
}

export const currentMonthLabel = "Abril · 2026";

export function brl(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

export function brlCompact(value: number) {
  if (Math.abs(value) >= 1000) {
    return "R$ " + (value / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "k";
  }
  return brl(value);
}

/* Mock current admin */
export const currentAdmin = {
  name: "Claudia Lima",
  initials: "CL",
  role: "Gestora · Aurora",
};

export const currentClient = {
  id: C1,
  ownerName: "Marcos Pereira",
  companyName: "Padaria São Jorge",
};
