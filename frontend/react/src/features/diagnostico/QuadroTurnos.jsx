import { Cartao, Ficha } from "../../components/ui/index.jsx";

// Por cargo e turno: quantas pessoas a loja tem (na pior hora do turno, no pior dia) × o que o turno exige.
export default function QuadroTurnos({ quadro }) {
  if (!quadro || quadro.cargos.length === 0) return null;
  const varios = quadro.turnos.length > 1;
  const comFalta = quadro.cargos.flatMap((c) => c.turnos.filter((t) => t.falta).map((t) => `${c.cargo} (${t.turno})`));

  return (
    <Cartao
      titulo={varios ? "Quadro por turno" : "Quadro do dia"}
      subtitulo="Pessoas que a loja tem × mínimo exigido. Conta a pior hora de cada turno, no pior dia da semana, já descontando intervalos."
    >
      <div className="flex flex-col gap-3 px-6 py-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-ink-500">
              <tr>
                <th className="py-1 pr-3">Cargo</th>
                {quadro.turnos.map((t) => (
                  <th key={t.nome} className="pr-3">{t.nome} <span className="font-normal">({t.inicio}–{t.fim})</span></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quadro.cargos.map((c) => (
                <tr key={c.cargo} className="border-t border-line">
                  <td className="py-2 pr-3 font-medium">{c.cargo}</td>
                  {c.turnos.map((t) => (
                    <td key={t.turno} className="pr-3" data-falta={t.falta ? "sim" : "nao"}>
                      {t.presentes === null ? "—" : (
                        <span className={t.falta ? "font-bold text-error-600" : ""}>
                          {t.presentes} / {t.exigido}
                        </span>
                      )}
                      {t.falta && <> <Ficha tom="erro">falta</Ficha></>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {comFalta.length > 0 && <p className="m-0 text-xs text-ink-500">Abaixo do mínimo: {comFalta.join(", ")}.</p>}
        {quadro.foraDaConta.length > 0 && (
          <p className="m-0 text-xs text-ink-500">
            Fora da conta: {quadro.foraDaConta.map((f) => `${f.nome} (${f.motivo})`).join("; ")}.
          </p>
        )}
      </div>
    </Cartao>
  );
}
