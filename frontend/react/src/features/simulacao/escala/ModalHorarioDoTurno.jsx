import { useRef, useState } from "react";
import { Botao, Campo, Modal, entrada } from "../../../components/ui/index.jsx";
import { horasCobertas } from "./escala-regras.js";
import { horarioMudou, horarioTexto, turnoDeValores, validarHorario, valoresDoTurno } from "./horario-exato-regras.js";

const CAMPOS = [
  ["entrada", "Entrada"],
  ["iniIntervalo", "Início do intervalo"],
  ["fimIntervalo", "Fim do intervalo"],
  ["saida", "Saída"],
];

// A janela do lápis (spec 062): o horário exato de uma pessoa num dia, com qualquer minuto. Valida em linguagem simples, não grava
// horário impossível e, ao salvar, devolve o turno novo (quem chama grava pelo mesmo caminho do arrastar). O intervalo é opcional.
export default function ModalHorarioDoTurno({ nome, diaPorExtenso, janela, turno, onSalvar, onFechar, devolverFocoPara = null }) {
  const [valores, setValores] = useState(() => valoresDoTurno(turno));
  const [tentou, setTentou] = useState(false);
  const formulario = useRef(null);
  const { erros, ok } = validarHorario(valores, janela);
  const mostrar = (campo) => (tentou ? erros[campo] : null);
  const novo = ok ? turnoDeValores(turno, valores) : null;

  const mudar = (campo) => (e) => setValores((v) => ({ ...v, [campo]: e.target.value }));
  const salvar = (e) => {
    e.preventDefault();
    setTentou(true);
    if (!ok) {
      // O foco vai ao primeiro campo com erro (depois de a tela mostrar os avisos).
      setTimeout(() => formulario.current?.querySelector('[aria-invalid="true"]')?.focus(), 0);
      return;
    }
    if (!horarioMudou(turno, novo)) return onFechar();
    onSalvar(novo);
  };

  return (
    <Modal titulo={`Horário de ${nome}`} subtitulo={`${diaPorExtenso} · a loja funciona das ${horarioTexto(janela.abre)} às ${horarioTexto(janela.fecha)}`} onClose={onFechar} devolverFocoPara={devolverFocoPara}>
      <form ref={formulario} onSubmit={salvar} noValidate className="flex flex-col gap-4" data-testid="form-horario-do-turno">
        <div className="grid grid-cols-2 gap-4">
          {CAMPOS.map(([campo, rotulo]) => (
            <Campo key={campo} rotulo={rotulo}>
              <input
                type="time"
                step="60"
                className={`${entrada} w-full`}
                value={valores[campo]}
                onChange={mudar(campo)}
                autoFocus={campo === "entrada"}
                aria-invalid={!!mostrar(campo)}
                aria-describedby={mostrar(campo) ? `erro-${campo}` : undefined}
                data-testid={`campo-${campo}`}
              />
              {mostrar(campo) && (
                <span id={`erro-${campo}`} role="alert" className="text-xs text-[var(--text-danger)]">
                  {mostrar(campo)}
                </span>
              )}
            </Campo>
          ))}
        </div>
        <p className="m-0 text-xs leading-4 text-[var(--text-secondary)]">
          Deixe o intervalo vazio se a pessoa não faz intervalo. {novo ? <span data-testid="horas-cobertas">Cobre as horas de {horasCobertas(novo)}.</span> : null}
        </p>
        <div className="flex justify-end gap-3">
          <Botao tipo="secundario" type="button" onClick={onFechar}>Cancelar</Botao>
          <Botao type="submit">Salvar</Botao>
        </div>
      </form>
    </Modal>
  );
}
