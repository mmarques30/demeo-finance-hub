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
    id: "c1",
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
    id: "c2",
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
    id: "c3",
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
    id: "c4",
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

export const transactions: Transaction[] = [
  // Padaria São Jorge
  buildTx("c1", "02/04", "Vendas balcão", 4820, "Receita · Vendas", "Itaú", "approved", true),
  buildTx("c1", "03/04", "Aluguel ponto", -6800, "Despesa Fixa · Aluguel", "Itaú", "approved", true),
  buildTx("c1", "04/04", "Folha funcionários", -18400, "Despesa Fixa · Salários", "Itaú", "approved", true),
  buildTx("c1", "05/04", "Compra farinha", -3120, "Despesa Variável · Insumos", "Santander"),
  buildTx("c1", "08/04", "iFood repasse", 9120, "Receita · Delivery", "Itaú", "approved", true),
  buildTx("c1", "10/04", "Energia Enel", -1480, "Despesa Fixa · Utilidades", "Itaú", "approved", true),
  buildTx("c1", "12/04", "Vendas semana", 12340, "Receita · Vendas", "Itaú"),
  buildTx("c1", "15/04", "Contabilidade", -890, "Despesa Fixa · Contabilidade", "Itaú", "approved", true),
  buildTx("c1", "18/04", "Manutenção forno", -2200, "Despesa Variável · Manutenção", "Santander"),

  // Restaurante Pernambuco
  buildTx("c2", "01/04", "Venda diária", 6200, "Receita · Vendas", "Bradesco"),
  buildTx("c2", "02/04", "Compra carnes", -8900, "Despesa Variável · Insumos", "Bradesco"),
  buildTx("c2", "05/04", "Folha cozinha", -22400, "Despesa Fixa · Salários", "Bradesco", "approved", true),
  buildTx("c2", "07/04", "PIX 4521", 1850, "—", "Bradesco", "pending"),
  buildTx("c2", "09/04", "DEB 887723", -640, "—", "Bradesco", "pending"),
  buildTx("c2", "10/04", "Aluguel Galeria", -9200, "Despesa Fixa · Aluguel", "Bradesco", "approved", true),
  buildTx("c2", "12/04", "TED Forneced", -4220, "—", "Bradesco", "pending"),
  buildTx("c2", "14/04", "Vendas final de semana", 18900, "Receita · Vendas", "Bradesco"),
  buildTx("c2", "16/04", "Marketing redes", -1800, "Despesa Variável · Marketing", "Bradesco"),
  buildTx("c2", "18/04", "PIX 9911", -320, "—", "Bradesco", "pending"),
  buildTx("c2", "19/04", "PIX 2230", 920, "—", "Bradesco", "pending"),
  buildTx("c2", "20/04", "DEB POSTO", -480, "—", "Bradesco", "pending"),
  buildTx("c2", "20/04", "PIX 8821", -260, "—", "Bradesco", "pending"),

  // Consultório Dra. Ana
  buildTx("c3", "03/04", "Consulta particular", 1200, "Receita · Serviços", "Inter"),
  buildTx("c3", "05/04", "Convênio Bradesco Saúde", 8200, "Receita · Convênios", "Inter", "approved", true),
  buildTx("c3", "06/04", "Aluguel sala", -3400, "Despesa Fixa · Aluguel", "Inter", "approved", true),
  buildTx("c3", "08/04", "Secretária", -3800, "Despesa Fixa · Salários", "Inter", "approved", true),
  buildTx("c3", "10/04", "Material descartável", -1240, "Despesa Variável · Insumos", "Nubank"),
  buildTx("c3", "12/04", "Convênio Sulamerica", 6800, "Receita · Convênios", "Inter", "approved", true),
  buildTx("c3", "16/04", "Curso aperfeiçoamento", -2400, "Investimento · Educação", "Nubank"),
  buildTx("c3", "19/04", "Consultas semana", 14200, "Receita · Serviços", "Inter"),

  // Escritório Lima
  buildTx("c4", "02/04", "Honorários cliente A", 12400, "Receita · Honorários", "Banco do Brasil"),
  buildTx("c4", "04/04", "Folha equipe", -28200, "Despesa Fixa · Salários", "Banco do Brasil", "approved", true),
  buildTx("c4", "06/04", "Aluguel", -4800, "Despesa Fixa · Aluguel", "Banco do Brasil", "approved", true),
  buildTx("c4", "08/04", "TED RECEB 2231", 8900, "—", "Banco do Brasil", "pending"),
  buildTx("c4", "10/04", "PIX 4498", -340, "—", "Banco do Brasil", "pending"),
  buildTx("c4", "11/04", "DEB CART 21", -1200, "—", "Banco do Brasil", "pending"),
  buildTx("c4", "12/04", "PIX 8723", -420, "—", "Banco do Brasil", "pending"),
  buildTx("c4", "12/04", "TED 9912", -2300, "—", "Banco do Brasil", "pending"),
  buildTx("c4", "13/04", "PIX RECEB 781", 4400, "—", "Banco do Brasil", "pending"),
  buildTx("c4", "14/04", "DEB POSTO", -680, "—", "Banco do Brasil", "pending"),
  buildTx("c4", "15/04", "PIX 5512", 2100, "—", "Banco do Brasil", "pending"),
  buildTx("c4", "15/04", "PIX 7782", -890, "—", "Banco do Brasil", "pending"),
  buildTx("c4", "16/04", "TED 4421", -1740, "—", "Banco do Brasil", "pending"),
  buildTx("c4", "17/04", "PIX 1198", 1320, "—", "Banco do Brasil", "pending"),
  buildTx("c4", "18/04", "DEB CART 99", -560, "—", "Banco do Brasil", "pending"),
  buildTx("c4", "19/04", "PIX 3327", -210, "—", "Banco do Brasil", "pending"),
  buildTx("c4", "19/04", "PIX 4490", -180, "—", "Banco do Brasil", "pending"),
  buildTx("c4", "20/04", "TED RECEB 8821", 7800, "—", "Banco do Brasil", "pending"),
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
  role: "Gestora · Aura",
};

export const currentClient = {
  id: "c1",
  ownerName: "Marcos Pereira",
  companyName: "Padaria São Jorge",
};
