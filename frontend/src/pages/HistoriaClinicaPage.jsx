import { useEffect, useMemo, useState } from 'react'
import { historiaClinicaApi, medicamentosApi } from '../api'
import { ApiError } from '../api/client'
import { formatearFecha, formatearFechaCorta } from '../lib/format'
import { Alert, Badge, Card, CenteredLoader, EmptyState, PageHeader } from '../components/ui'

export default function HistoriaClinicaPage() {
  const [historia, setHistoria] = useState(null)
  const [medicamentos, setMedicamentos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [sinHistoria, setSinHistoria] = useState(false)

  useEffect(() => {
    setCargando(true)
    Promise.all([historiaClinicaApi.mia(), medicamentosApi.listar({ limit: 200 }).catch(() => ({ items: [] }))])
      .then(([datosHistoria, pagina]) => {
        setHistoria(datosHistoria)
        setMedicamentos(pagina.items)
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setSinHistoria(true)
        } else {
          setError(err instanceof ApiError ? err.message : 'No se pudo cargar tu historia clínica.')
        }
      })
      .finally(() => setCargando(false))
  }, [])

  const medicamentosPorId = useMemo(() => new Map(medicamentos.map((m) => [m.id, m])), [medicamentos])

  if (cargando) return <CenteredLoader label="Cargando tu historia clínica…" />

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Mi historia clínica" description="Información clínica simulada dentro de tu IPS." />

      {error && <Alert variant="error">{error}</Alert>}

      {sinHistoria ? (
        <EmptyState
          title="Aún no hay historia clínica"
          description="Tu IPS todavía no ha registrado historia clínica para tu usuario."
        />
      ) : (
        historia && (
          <>
            <Card>
              <p className="text-sm text-slate-400">{historia.ips_nombre}</p>
              <h2 className="mt-1 font-semibold text-slate-900">{historia.diagnostico_simulado}</h2>
              <p className="mt-2 text-xs text-slate-400">Actualizado el {formatearFecha(historia.actualizado_en)}</p>
            </Card>

            <h3 className="mb-3 mt-6 font-semibold text-slate-900">Prescripciones</h3>
            {historia.prescripciones.length === 0 ? (
              <EmptyState title="Sin prescripciones registradas" />
            ) : (
              <div className="flex flex-col gap-3">
                {historia.prescripciones.map((prescripcion) => {
                  const medicamento = medicamentosPorId.get(prescripcion.medicamento_id)
                  return (
                    <Card key={prescripcion.id} className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-800">
                          {medicamento ? medicamento.nombre_comercial : `Medicamento #${prescripcion.medicamento_id}`}
                        </p>
                        <p className="text-sm text-slate-500">Formulado el {formatearFechaCorta(prescripcion.fecha_formula)}</p>
                      </div>
                      <Badge color={prescripcion.vigente ? 'green' : 'slate'}>
                        {prescripcion.vigente ? 'Vigente' : 'No vigente'}
                      </Badge>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )
      )}
    </div>
  )
}
