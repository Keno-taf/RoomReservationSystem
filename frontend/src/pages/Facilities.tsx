import { useEffect, useState } from 'react'

import { useAuth } from '../context/useAuth'

import api from '../services/api'


interface Facility {

  id: number

  name: string

  description: string

  image_url: string | null

  location: string

  capacity: number

  status: string

}


function Facilities() {

  const { user } = useAuth()


  const [facilities, setFacilities] =
    useState<Facility[]>([])


  const [loading, setLoading] =
    useState(true)


  const [error, setError] =
    useState('')


  const [showForm, setShowForm] =
    useState(false)


  const [saving, setSaving] =
    useState(false)


  const [formError, setFormError] =
    useState('')


  const [editingFacilityId, setEditingFacilityId] =
    useState<number | null>(null)


  const [name, setName] =
    useState('')


  const [description, setDescription] =
    useState('')


  const [location, setLocation] =
    useState('')


  const [capacity, setCapacity] =
    useState('')


  const [status, setStatus] =
    useState('Available')


  const [image, setImage] =
    useState<File | null>(null)


  const isFacilityManager =
    user?.roleIds.includes(3) ?? false


  /*
  |--------------------------------------------------------------------------
  | LOAD FACILITIES
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    const loadFacilities = async () => {

      try {

        setLoading(true)

        setError('')


        const response =
          await api.get('/facilities')


        if (response.data.success) {

          setFacilities(
            response.data.data
          )

        } else {

          setError(
            response.data.message ||
              'Failed to load facilities'
          )

        }

      } catch (error) {

        console.error(
          'Error loading facilities:',
          error
        )

        setError(
          'Failed to load facilities'
        )

      } finally {

        setLoading(false)

      }

    }


    loadFacilities()

  }, [])


  /*
  |--------------------------------------------------------------------------
  | RESET FORM
  |--------------------------------------------------------------------------
  */

  const resetForm = () => {

    setName('')

    setDescription('')

    setLocation('')

    setCapacity('')

    setStatus('Available')

    setImage(null)

    setFormError('')

    setEditingFacilityId(null)

  }


  /*
  |--------------------------------------------------------------------------
  | OPEN CREATE FORM
  |--------------------------------------------------------------------------
  */

  const openForm = () => {

    resetForm()

    setShowForm(true)

  }


  /*
  |--------------------------------------------------------------------------
  | OPEN EDIT FORM
  |--------------------------------------------------------------------------
  */

  const openEditForm = (
    facility: Facility
  ) => {

    setEditingFacilityId(
      facility.id
    )

    setName(
      facility.name
    )

    setDescription(
      facility.description
    )

    setLocation(
      facility.location
    )

    setCapacity(
      String(facility.capacity)
    )

    setStatus(
      facility.status
    )

    setImage(null)

    setFormError('')

    setShowForm(true)

  }


  /*
  |--------------------------------------------------------------------------
  | CLOSE FORM
  |--------------------------------------------------------------------------
  */

  const closeForm = () => {

    if (saving) {
      return
    }

    setShowForm(false)

    resetForm()

  }


  /*
  |--------------------------------------------------------------------------
  | CREATE / UPDATE FACILITY
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {

    event.preventDefault()

    setFormError('')


    /*
    |--------------------------------------------------------------------------
    | VALIDATION
    |--------------------------------------------------------------------------
    */

    if (!name.trim()) {

      setFormError(
        'Facility name is required.'
      )

      return

    }


    if (!description.trim()) {

      setFormError(
        'Facility description or history is required.'
      )

      return

    }


    if (!location.trim()) {

      setFormError(
        'Facility location is required.'
      )

      return

    }


    if (
      !capacity ||
      Number(capacity) <= 0 ||
      !Number.isInteger(
        Number(capacity)
      )
    ) {

      setFormError(
        'Capacity must be a positive whole number.'
      )

      return

    }


    /*
    |--------------------------------------------------------------------------
    | IMAGE REQUIRED ONLY WHEN CREATING
    |--------------------------------------------------------------------------
    */

    if (
      editingFacilityId === null &&
      !image
    ) {

      setFormError(
        'Facility image is required.'
      )

      return

    }


    try {

      setSaving(true)


      /*
      |--------------------------------------------------------------------------
      | FORM DATA
      |--------------------------------------------------------------------------
      */

      const formData =
        new FormData()


      formData.append(
        'name',
        name.trim()
      )


      formData.append(
        'description',
        description.trim()
      )


      formData.append(
        'location',
        location.trim()
      )


      formData.append(
        'capacity',
        capacity
      )


      formData.append(
        'status',
        status
      )


      /*
      |--------------------------------------------------------------------------
      | IMAGE
      |--------------------------------------------------------------------------
      */

      if (image) {

        formData.append(
          'image',
          image
        )

      }


      /*
      |--------------------------------------------------------------------------
      | CREATE
      |--------------------------------------------------------------------------
      */

      if (
        editingFacilityId === null
      ) {

        const response =
          await api.post(
            '/facilities',
            formData
          )


        if (
          !response.data.success
        ) {

          setFormError(
            response.data.message ||
              'Failed to create facility.'
          )

          return

        }


        setFacilities(
          (currentFacilities) => [
            response.data.data,
            ...currentFacilities
          ]
        )

      }


      /*
      |--------------------------------------------------------------------------
      | UPDATE
      |--------------------------------------------------------------------------
      */

      else {

        const response =
          await api.put(
            `/facilities/${editingFacilityId}`,
            formData
          )


        if (
          !response.data.success
        ) {

          setFormError(
            response.data.message ||
              'Failed to update facility.'
          )

          return

        }


        setFacilities(
          (currentFacilities) =>
            currentFacilities.map(
              (facility) =>
                facility.id ===
                editingFacilityId
                  ? response.data.data
                  : facility
            )
        )

      }


      /*
      |--------------------------------------------------------------------------
      | CLOSE FORM
      |--------------------------------------------------------------------------
      */

      setShowForm(false)

      resetForm()


    } catch (error: unknown) {

      console.error(
        'Error saving facility:',
        error
      )


      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error
      ) {

        const axiosError =
          error as {
            response?: {
              data?: {
                message?: string
              }
            }
          }


        const message =
          axiosError.response?.data?.message


        if (message) {

          setFormError(
            message
          )

          return

        }

      }


      setFormError(
        editingFacilityId === null
          ? 'Failed to create facility. Please try again.'
          : 'Failed to update facility. Please try again.'
      )


    } finally {

      setSaving(false)

    }

  }


  /*
  |--------------------------------------------------------------------------
  | DELETE FACILITY
  |--------------------------------------------------------------------------
  */

  const handleDelete = async (
    facility: Facility
  ) => {

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${facility.name}"?`
      )


    if (!confirmed) {
      return
    }


    try {

      const response =
        await api.delete(
          `/facilities/${facility.id}`
        )


      if (
        !response.data.success
      ) {

        window.alert(
          response.data.message ||
            'Failed to delete facility.'
        )

        return

      }


      setFacilities(
        (currentFacilities) =>
          currentFacilities.filter(
            (item) =>
              item.id !== facility.id
          )
      )


    } catch (error: unknown) {

      console.error(
        'Error deleting facility:',
        error
      )


      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error
      ) {

        const axiosError =
          error as {
            response?: {
              data?: {
                message?: string
              }
            }
          }


        const message =
          axiosError.response?.data?.message


        if (message) {

          window.alert(message)

          return

        }

      }


      window.alert(
        'Failed to delete facility. Please try again.'
      )

    }

  }


  return (

    <div className="space-y-6">


      {/* =========================================================
          PAGE HEADER
      ========================================================= */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-2xl font-bold text-gray-900">
            Facilities
          </h1>


          <p className="mt-1 text-sm text-gray-500">
            View available rooms and halls
          </p>

        </div>


        {isFacilityManager && (

          <button
            type="button"
            onClick={openForm}
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + Add Facility
          </button>

        )}

      </div>


      {/* =========================================================
          ERROR
      ========================================================= */}

      {error && (

        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          {error}

        </div>

      )}


      {/* =========================================================
          ADD / EDIT FORM
      ========================================================= */}

      {showForm && (

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">


          <div className="mb-6 flex items-center justify-between">

            <div>

              <h2 className="text-xl font-bold text-gray-900">

                {editingFacilityId === null
                  ? 'Add Facility'
                  : 'Edit Facility'}

              </h2>


              <p className="mt-1 text-sm text-gray-500">

                {editingFacilityId === null
                  ? 'Add a new room or hall to the system.'
                  : 'Update the facility information.'}

              </p>

            </div>


            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="rounded-lg px-3 py-2 text-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              ×
            </button>

          </div>


          {/* FORM ERROR */}

          {formError && (

            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

              {formError}

            </div>

          )}


          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >


            {/* NAME */}

            <div>

              <label
                htmlFor="facility-name"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Facility Name
              </label>


              <input
                id="facility-name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                placeholder="Example: Main Conference Hall"
                disabled={saving}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />

            </div>


            {/* DESCRIPTION */}

            <div>

              <label
                htmlFor="facility-description"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                History / Meaning / Description
              </label>


              <textarea
                id="facility-description"
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                placeholder="Explain the history, meaning, purpose, or important information about this facility."
                rows={5}
                disabled={saving}
                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />


              <p className="mt-1 text-xs text-gray-500">
                This information will be visible to employees
                and department heads.
              </p>

            </div>


            {/* LOCATION + CAPACITY */}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">


              <div>

                <label
                  htmlFor="facility-location"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Location
                </label>


                <input
                  id="facility-location"
                  type="text"
                  value={location}
                  onChange={(event) =>
                    setLocation(
                      event.target.value
                    )
                  }
                  placeholder="Example: Main Building"
                  disabled={saving}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />

              </div>


              <div>

                <label
                  htmlFor="facility-capacity"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Capacity
                </label>


                <input
                  id="facility-capacity"
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(event) =>
                    setCapacity(
                      event.target.value
                    )
                  }
                  placeholder="Example: 100"
                  disabled={saving}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />

              </div>

            </div>


            {/* STATUS */}

            <div>

              <label
                htmlFor="facility-status"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Status
              </label>


              <select
                id="facility-status"
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value
                  )
                }
                disabled={saving}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >

                <option value="Available">
                  Available
                </option>

                <option value="Maintenance">
                  Maintenance
                </option>

                <option value="Unavailable">
                  Unavailable
                </option>

              </select>

            </div>


            {/* IMAGE */}

            <div>

              <label
                htmlFor="facility-image"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Facility Image
              </label>


              <input
                id="facility-image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                disabled={saving}
                onChange={(event) => {

                  const selectedFile =
                    event.target.files?.[0]

                  setImage(
                    selectedFile || null
                  )

                }}
                className="block w-full rounded-lg border border-gray-300 bg-white text-sm text-gray-700 file:mr-4 file:border-0 file:bg-gray-100 file:px-4 file:py-3 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
              />


              <p className="mt-1 text-xs text-gray-500">

                {editingFacilityId === null
                  ? 'JPG, JPEG, PNG or WEBP. Maximum 5 MB.'
                  : 'Leave empty to keep the existing image. JPG, JPEG, PNG or WEBP. Maximum 5 MB.'}

              </p>

            </div>


            {/* ACTION BUTTONS */}

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-6">


              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>


              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
              >

                {saving
                  ? 'Saving...'
                  : editingFacilityId === null
                    ? 'Save Facility'
                    : 'Update Facility'}

              </button>

            </div>


          </form>

        </div>

      )}


      {/* =========================================================
          LOADING
      ========================================================= */}

      {loading && (

        <div className="rounded-xl bg-white p-10 text-center shadow-sm">

          <p className="text-gray-500">
            Loading facilities...
          </p>

        </div>

      )}


      {/* =========================================================
          EMPTY
      ========================================================= */}

      {!loading &&
        !error &&
        facilities.length === 0 && (

          <div className="rounded-xl bg-white p-10 text-center shadow-sm">

            <div className="text-4xl">
              🏢
            </div>


            <h2 className="mt-4 text-lg font-semibold text-gray-800">
              No facilities found
            </h2>


            <p className="mt-2 text-sm text-gray-500">
              No rooms or halls have been added yet.
            </p>

          </div>

        )}


      {/* =========================================================
          FACILITY CARDS
      ========================================================= */}

      {!loading &&
        facilities.length > 0 && (

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">


            {facilities.map(
              (facility) => (

                <div
                  key={facility.id}
                  className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 transition hover:shadow-md"
                >


                  {/* IMAGE */}

                  <div className="h-56 w-full bg-gray-100">

                    {facility.image_url ? (

                      <img
                        src={`http://localhost:5000${facility.image_url}`}
                        alt={facility.name}
                        className="h-full w-full object-cover"
                      />

                    ) : (

                      <div className="flex h-full items-center justify-center text-gray-400">

                        <div className="text-center">

                          <div className="text-5xl">
                            🏢
                          </div>


                          <p className="mt-2 text-sm">
                            No image available
                          </p>

                        </div>

                      </div>

                    )}

                  </div>


                  {/* CONTENT */}

                  <div className="p-5">


                    <div className="flex items-start justify-between gap-3">


                      <h2 className="text-xl font-bold text-gray-900">
                        {facility.name}
                      </h2>


                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                          facility.status.toLowerCase() ===
                          'available'
                            ? 'bg-green-100 text-green-700'
                            : facility.status.toLowerCase() ===
                                'maintenance'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {facility.status}
                      </span>


                    </div>


                    {/* DESCRIPTION */}

                    <div className="mt-4">

                      <h3 className="text-sm font-semibold text-gray-700">
                        About this facility
                      </h3>


                      <p className="mt-1 line-clamp-4 text-sm leading-6 text-gray-600">
                        {facility.description}
                      </p>

                    </div>


                    {/* LOCATION + CAPACITY */}

                    <div className="mt-5 space-y-3 border-t border-gray-100 pt-4">


                      <div className="flex items-center gap-3">

                        <span className="text-lg">
                          📍
                        </span>


                        <div>

                          <p className="text-xs text-gray-400">
                            Location
                          </p>


                          <p className="text-sm font-medium text-gray-700">
                            {facility.location}
                          </p>

                        </div>

                      </div>


                      <div className="flex items-center gap-3">

                        <span className="text-lg">
                          👥
                        </span>


                        <div>

                          <p className="text-xs text-gray-400">
                            Capacity
                          </p>


                          <p className="text-sm font-medium text-gray-700">
                            {facility.capacity} people
                          </p>

                        </div>

                      </div>


                    </div>


                    {/* MANAGER ACTIONS */}

                    {isFacilityManager && (

                      <div className="mt-5 flex gap-3 border-t border-gray-100 pt-4">


                        <button
                          type="button"
                          onClick={() =>
                            openEditForm(
                              facility
                            )
                          }
                          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                        >
                          Edit
                        </button>


                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              facility
                            )
                          }
                          className="flex-1 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                          Delete
                        </button>


                      </div>

                    )}


                  </div>

                </div>

              )
            )}

          </div>

        )}

    </div>

  )

}


export default Facilities