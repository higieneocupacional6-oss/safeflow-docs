DELETE FROM public.ltcat_av_equipamentos a
USING public.ltcat_av_equipamentos b
WHERE a.id > b.id
  AND a.avaliacao_id = b.avaliacao_id
  AND COALESCE(a.nome_equipamento,'') = COALESCE(b.nome_equipamento,'')
  AND COALESCE(a.serie_equipamento,'') = COALESCE(b.serie_equipamento,'')
  AND COALESCE(a.modelo_equipamento,'') = COALESCE(b.modelo_equipamento,'')
  AND COALESCE(a.data_avaliacao::text,'') = COALESCE(b.data_avaliacao::text,'')
  AND COALESCE(a.data_calibracao::text,'') = COALESCE(b.data_calibracao::text,'');