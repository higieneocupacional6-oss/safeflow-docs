import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { supabase } from "@/integrations/supabase/client";
import { renderHtmlTemplateToDocx } from "./htmlTemplate";
import { sanitizeDocxZip } from "./conditionalBlocks";
import { mesesCronograma, type CronogramaVale } from "../../supabase/functions/_shared/aetValeCronograma";

export async function renderPlanoValeTemplate(template: {file_path:string}, plano:CronogramaVale, empresa: Record<string,unknown>, contrato:Record<string,unknown>) {
  const {data:blob,error}=await supabase.storage.from("templates").download(template.file_path);
  if(error || !blob) throw new Error("Não foi possível abrir o template selecionado.");
  const meses=mesesCronograma(plano.anoInicial,plano.anoFinal);
  const acoes=plano.acoes.map(a=>({...a,o_que_sera_feito:a.o_que,porque:a.por_que,data:a.quando,como_sera_feito:a.como,valor_previsto:a.quanto,meses:meses.map(m=>({mes:plano.nomesMeses[m.id] ?? m.nome,status:{azul:"Previsto",verde:"Realizado",vermelho:"Não realizado","":""}[a.meses[m.id] || ""]}))}));
  const data={...empresa,...contrato,empresa:empresa.razao_social,empresa_nome:empresa.razao_social,ano_inicial:plano.anoInicial,ano_final:plano.anoFinal,plano_acao:acoes,cronograma:acoes,acoes,setores:[],funcoes:[]};
  if(/\.html?$/i.test(template.file_path)) return renderHtmlTemplateToDocx(await blob.text(),data);
  const doc=new Docxtemplater(new PizZip(await blob.arrayBuffer()),{paragraphLoop:true,linebreaks:true,delimiters:{start:"{{",end:"}}"},nullGetter:()=>""});
  doc.render(data); sanitizeDocxZip(doc.getZip());
  return doc.getZip().generate({type:"blob",compression:"DEFLATE",mimeType:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"});
}