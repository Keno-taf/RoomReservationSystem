import { useEffect, useState, type FormEvent } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { getFacilities, type Facility } from '../services/facilityService'
import { createReservation } from '../services/reservationService'

function ReservationRequest() {
  const { t } = useTranslation()

  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loadingFacilities, setLoadingFacilities] = useState(true)
  const [facilityError, setFacilityError] = useState('')

  const [facilityId, setFacilityId] = useState('')
  const [reservationDate, setReservationDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [purpose, setPurpose] = useState('')
  const [participants, setParticipants] = useState('')
  const [additionalRequirements, setAdditionalRequirements] = useState('')
  const [notes, setNotes] = useState('')
  const [approvalRouteId, setApprovalRouteId] = useState('')

  const [phoneNumber, setPhoneNumber] = useState('')
  const [additionalPhoneNumber, setAdditionalPhoneNumber] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')

  useEffect(() => {
    const loadFacilities = async () => {
      try {
        const data = await getFacilities()
        setFacilities(data)
      } catch (error) {
        console.error('Failed to load facilities:', error)
        setFacilityError(t('reservation.messages.facilityLoadError'))
      } finally {
        setLoadingFacilities(false)
      }
    }

    void loadFacilities()
  }, [t])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setSubmitError('')
    setSubmitSuccess('')

    // Accept Ethiopian mobile numbers such as 0912345678,
    // 912345678, or +251912345678.
    const phonePattern = /^(\+251|0)?[79]\d{8}$/
    const primaryPhone = phoneNumber.trim()
    const secondaryPhone = additionalPhoneNumber.trim()

    if (!phonePattern.test(primaryPhone)) {
      setSubmitError(t('reservation.messages.invalidPhone'))
      return
    }

    if (secondaryPhone && !phonePattern.test(secondaryPhone)) {
      setSubmitError(t('reservation.messages.invalidAdditionalPhone'))
      return
    }

    if (endTime <= startTime) {
      setSubmitError(t('reservation.messages.endTimeMustBeAfterStart'))
      return
    }

    setSubmitting(true)

    try {
      await createReservation({
        facilityId: Number(facilityId),
        approvalRouteId: Number(approvalRouteId),
        reservationDate,
        startTime,
        endTime,
        purpose,
        participants: Number(participants),
        additionalRequirements,
        notes,
        // These fields require matching support in reservationService and the backend.
        phoneNumber: primaryPhone,
        additionalPhoneNumber: secondaryPhone || null,
      })

      setSubmitSuccess(t('reservation.messages.submitSuccess'))

      setFacilityId('')
      setReservationDate('')
      setStartTime('')
      setEndTime('')
      setPurpose('')
      setParticipants('')
      setAdditionalRequirements('')
      setNotes('')
      setApprovalRouteId('')
      setPhoneNumber('')
      setAdditionalPhoneNumber('')
    } catch (error) {
      console.error('Failed to submit reservation:', error)

      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message ||
          t('reservation.messages.submitError')
        setSubmitError(message)
      } else {
        setSubmitError(t('reservation.messages.submitError'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const clearForm = () => {
    setFacilityId('')
    setReservationDate('')
    setStartTime('')
    setEndTime('')
    setPurpose('')
    setParticipants('')
    setAdditionalRequirements('')
    setNotes('')
    setApprovalRouteId('')
    setPhoneNumber('')
    setAdditionalPhoneNumber('')
    setSubmitError('')
    setSubmitSuccess('')
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {t('reservation.requestTitle')}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t('reservation.requestDescription')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 p-6">
            {submitError && (
              <div
                role="alert"
                className="rounded-lg bg-red-50 p-4 text-sm text-red-700"
              >
                {submitError}
              </div>
            )}

            {submitSuccess && (
              <div
                role="status"
                className="rounded-lg bg-green-50 p-4 text-sm text-green-700"
              >
                {submitSuccess}
              </div>
            )}

            <section>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                {t('reservation.facilityInformation')}
              </h3>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="facilityId"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    {t('reservation.facility')}
                  </label>
                  <select
                    id="facilityId"
                    name="facilityId"
                    required
                    value={facilityId}
                    onChange={(e) => setFacilityId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">{t('reservation.selectFacility')}</option>
                    {loadingFacilities && (
                      <option disabled>{t('common.loadingFacilities')}</option>
                    )}
                    {facilities.map((facility) => (
                      <option key={facility.id} value={facility.id}>
                        {facility.name} — {t('reservation.capacity')}: {facility.capacity}
                      </option>
                    ))}
                  </select>
                  {facilityError && (
                    <p className="mt-2 text-sm text-red-600">{facilityError}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="purpose"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    {t('reservation.purpose')}
                  </label>
                  <input
                    id="purpose"
                    type="text"
                    required
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder={t('reservation.purposePlaceholder')}
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                {t('reservation.dateAndTime')}
              </h3>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                  <label
                    htmlFor="reservationDate"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    {t('reservation.date')}
                  </label>
                  <input
                    id="reservationDate"
                    type="date"
                    required
                    min={new Date().toLocaleDateString('en-CA')}
                    value={reservationDate}
                    onChange={(e) => setReservationDate(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="startTime"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    {t('reservation.startTime')}
                  </label>
                  <input
                    id="startTime"
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="endTime"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    {t('reservation.endTime')}
                  </label>
                  <input
                    id="endTime"
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                {t('reservation.reservationDetails')}
              </h3>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="participants"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    {t('reservation.participants')}
                  </label>
                  <input
                    id="participants"
                    type="number"
                    min="1"
                    required
                    value={participants}
                    onChange={(e) => setParticipants(e.target.value)}
                    placeholder={t('reservation.participantsPlaceholder')}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="additionalRequirements"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    {t('reservation.additionalRequirements')}
                  </label>
                  <input
                    id="additionalRequirements"
                    type="text"
                    value={additionalRequirements}
                    onChange={(e) => setAdditionalRequirements(e.target.value)}
                    placeholder={t('reservation.additionalRequirementsPlaceholder')}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="phoneNumber"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    {t('reservation.mobilePhoneNumber')}{' '}
                    <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    required
                    autoComplete="tel"
                    inputMode="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder={t('reservation.mobilePhonePlaceholder')}
                    pattern="(\+251|0)?[79][0-9]{8}"
                    title={t('reservation.messages.invalidPhone')}
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {t('reservation.smsNotificationHelp')}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="additionalPhoneNumber"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    {t('reservation.additionalPhoneNumber')}{' '}
                    <span className="font-normal text-gray-500">
                      ({t('common.optional')})
                    </span>
                  </label>
                  <input
                    id="additionalPhoneNumber"
                    name="additionalPhoneNumber"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    value={additionalPhoneNumber}
                    onChange={(e) => setAdditionalPhoneNumber(e.target.value)}
                    placeholder={t('reservation.additionalPhonePlaceholder')}
                    pattern="(\+251|0)?[79][0-9]{8}"
                    title={t('reservation.messages.invalidAdditionalPhone')}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mt-6">
                <label
                  htmlFor="notes"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  {t('reservation.descriptionNotes')}
                </label>
                <textarea
                  id="notes"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('reservation.notesPlaceholder')}
                  className={inputClass}
                />
              </div>
            </section>

            <section>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                {t('reservation.approvalRoute')}
              </h3>

              <div className="space-y-4">
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-300 p-4 hover:bg-gray-50">
                  <input
                    type="radio"
                    name="approvalRoute"
                    value="1"
                    required
                    checked={approvalRouteId === '1'}
                    onChange={(e) => setApprovalRouteId(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      {t('reservation.facilityManager')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t('reservation.routeFacilityManager')}
                    </p>
                  </div>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-300 p-4 hover:bg-gray-50">
                  <input
                    type="radio"
                    name="approvalRoute"
                    value="2"
                    checked={approvalRouteId === '2'}
                    onChange={(e) => setApprovalRouteId(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      {t('reservation.departmentHead')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t('reservation.routeDepartmentHead')}
                    </p>
                  </div>
                </label>
              </div>
            </section>

            <div className="flex items-center justify-end gap-4 border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={clearForm}
                className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-50"
              >
                {t('common.clearForm')}
              </button>

              <button
                type="submit"
                disabled={submitting || loadingFacilities}
                className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? t('common.submitting')
                  : t('reservation.submitRequest')}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

export default ReservationRequest
