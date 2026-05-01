import { GoogleGenerativeAI } from "@google/generative-ai";

export async function gerarPlano(dados_do_paciente, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  // Tentando 2.0-flash pois o 2.5 está com alta demanda
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `Você é um nutricionista profissional.
Gere um plano alimentar semanal com base nos dados abaixo.

⚠️ Regras:
- Responda APENAS em JSON válido
- Não use markdown
- Não escreva explicações
- Respeite restrições e alergias

Dados do paciente:
${JSON.stringify(dados_do_paciente)}

Formato obrigatório:
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["", "", "", "", ""],
        "lanche_manha": ["", "", "", "", ""],
        "almoco": ["", "", "", "", ""],
        "lanche_tarde": ["", "", "", "", ""],
        "jantar": ["", "", "", "", ""]
      }
    }
  ]
}

Regras:
- gerar 7 dias
- 5 opções por refeição
- evitar repetição
- usar alimentos comuns no Brasil`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  let text = response.text();
  text = text.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(text);
}
