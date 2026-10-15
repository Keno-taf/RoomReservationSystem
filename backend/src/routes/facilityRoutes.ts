import { Router } from 'express'

import pool from '../config/database.js'

import { AuthenticatedRequest } from '../middleware/authMiddleware.js'

import {
  requirePermission
} from '../middleware/permissionMiddleware.js'

import { logAudit } from '../utils/auditLogger.js'

import uploadFacilityImage from '../middleware/uploadMiddleware.js'


const router = Router()


/*
|--------------------------------------------------------------------------
| GET ALL FACILITIES
|--------------------------------------------------------------------------
| Employee, Department Head, Facility Manager and Administrator
| can view facilities if they have facility.view permission.
*/

router.get(
  '/',
  requirePermission('facility.view'),
  async (
    req: AuthenticatedRequest,
    res
  ) => {

    try {

      const result = await pool.query(`
        SELECT
          id,
          name,
          description,
          image_url,
          location,
          capacity,
          status
        FROM facilities
        ORDER BY name
      `)

      return res.json({
        success: true,
        data: result.rows
      })

    } catch (error: unknown) {

      console.error(
        'Error fetching facilities:',
        error
      )

      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve facilities'
      })
    }
  }
)


/*
|--------------------------------------------------------------------------
| GET FACILITY BY ID
|--------------------------------------------------------------------------
*/

router.get(
  '/:id',
  requirePermission('facility.view'),
  async (
    req: AuthenticatedRequest,
    res
  ) => {

    try {

      const facilityId =
        Number(req.params.id)

      if (Number.isNaN(facilityId)) {

        return res.status(400).json({
          success: false,
          message: 'Invalid facility ID'
        })
      }


      const result = await pool.query(
        `
        SELECT
          id,
          name,
          description,
          image_url,
          location,
          capacity,
          status
        FROM facilities
        WHERE id = $1
        `,
        [facilityId]
      )


      if (result.rows.length === 0) {

        return res.status(404).json({
          success: false,
          message: 'Facility not found'
        })
      }


      return res.json({
        success: true,
        data: result.rows[0]
      })

    } catch (error: unknown) {

      console.error(
        'Error fetching facility:',
        error
      )

      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve facility'
      })
    }
  }
)


/*
|--------------------------------------------------------------------------
| CREATE FACILITY
|--------------------------------------------------------------------------
| Facility Manager and Administrator
|--------------------------------------------------------------------------
| Form-data fields:
|
| name
| description
| location
| capacity
| status
| image
|
*/

router.post(
  '/',
  requirePermission('facility.create'),
  uploadFacilityImage.single('image'),
  async (
    req: AuthenticatedRequest,
    res
  ) => {

    try {

      const {
        name,
        description,
        location,
        capacity,
        status
      } = req.body


      /*
      |--------------------------------------------------------------------------
      | VALIDATE FACILITY NAME
      |--------------------------------------------------------------------------
      */

      if (!name || !name.trim()) {

        return res.status(400).json({
          success: false,
          message: 'Facility name is required'
        })
      }


      /*
      |--------------------------------------------------------------------------
      | VALIDATE DESCRIPTION
      |--------------------------------------------------------------------------
      */

      if (
        !description ||
        !description.trim()
      ) {

        return res.status(400).json({
          success: false,
          message:
            'Facility description or history is required'
        })
      }


      /*
      |--------------------------------------------------------------------------
      | VALIDATE LOCATION
      |--------------------------------------------------------------------------
      */

      if (
        !location ||
        !location.trim()
      ) {

        return res.status(400).json({
          success: false,
          message:
            'Facility location is required'
        })
      }


      /*
      |--------------------------------------------------------------------------
      | VALIDATE CAPACITY
      |--------------------------------------------------------------------------
      */

      const numericCapacity =
        Number(capacity)


      if (
        !Number.isInteger(numericCapacity) ||
        numericCapacity <= 0
      ) {

        return res.status(400).json({
          success: false,
          message:
            'Capacity must be a positive whole number'
        })
      }


      /*
      |--------------------------------------------------------------------------
      | VALIDATE IMAGE
      |--------------------------------------------------------------------------
      */

      if (!req.file) {

        return res.status(400).json({
          success: false,
          message:
            'Facility image is required'
        })
      }


      /*
      |--------------------------------------------------------------------------
      | FACILITY STATUS
      |--------------------------------------------------------------------------
      */

      const facilityStatus =
        status || 'Available'


      /*
      |--------------------------------------------------------------------------
      | CHECK DUPLICATE FACILITY
      |--------------------------------------------------------------------------
      */

      const existingFacility =
        await pool.query(
          `
          SELECT id
          FROM facilities
          WHERE LOWER(name) = LOWER($1)
          `,
          [name.trim()]
        )


      if (
        existingFacility.rows.length > 0
      ) {

        return res.status(409).json({
          success: false,
          message:
            'A facility with this name already exists'
        })
      }


      /*
      |--------------------------------------------------------------------------
      | IMAGE URL
      |--------------------------------------------------------------------------
      */

      const imageUrl =
        `/uploads/facilities/${req.file.filename}`


      /*
      |--------------------------------------------------------------------------
      | CREATE FACILITY
      |--------------------------------------------------------------------------
      */

      const result =
        await pool.query(
          `
          INSERT INTO facilities (
            name,
            description,
            image_url,
            location,
            capacity,
            status
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING
            id,
            name,
            description,
            image_url,
            location,
            capacity,
            status
          `,
          [
            name.trim(),
            description.trim(),
            imageUrl,
            location.trim(),
            numericCapacity,
            facilityStatus
          ]
        )


      const newFacility =
        result.rows[0]


      /*
      |--------------------------------------------------------------------------
      | AUDIT LOG
      |--------------------------------------------------------------------------
      */

      await logAudit({

        userId:
          req.user!.userId,

        action:
          'CREATE',

        module:
          'FACILITY',

        entityType:
          'Facility',

        entityId:
          newFacility.id,

        description:
          `Created facility: ${newFacility.name}`,

        newValues: {

          name:
            newFacility.name,

          description:
            newFacility.description,

          imageUrl:
            newFacility.image_url,

          location:
            newFacility.location,

          capacity:
            newFacility.capacity,

          status:
            newFacility.status
        },

        ipAddress:
          req.ip,

        userAgent:
          req.get('user-agent')
      })


      /*
      |--------------------------------------------------------------------------
      | RETURN SUCCESS
      |--------------------------------------------------------------------------
      */

      return res.status(201).json({

        success: true,

        message:
          'Facility created successfully',

        data:
          newFacility
      })

    } catch (error: unknown) {

      console.error(
        'Error creating facility:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Failed to create facility'
      })
    }
  }
)


/*
|--------------------------------------------------------------------------
| UPDATE FACILITY
|--------------------------------------------------------------------------
| Facility Manager and Administrator
|
| Image is optional during update.
| If a new image is uploaded, it replaces the image URL in the database.
|--------------------------------------------------------------------------
*/

router.put(
  '/:id',
  requirePermission('facility.edit'),
  uploadFacilityImage.single('image'),
  async (
    req: AuthenticatedRequest,
    res
  ) => {

    try {

      /*
      |--------------------------------------------------------------------------
      | GET FACILITY ID
      |--------------------------------------------------------------------------
      */

      const facilityId =
        Number(req.params.id)


      if (Number.isNaN(facilityId)) {

        return res.status(400).json({
          success: false,
          message:
            'Invalid facility ID'
        })
      }


      /*
      |--------------------------------------------------------------------------
      | GET REQUEST DATA
      |--------------------------------------------------------------------------
      */

      const {
        name,
        description,
        location,
        capacity,
        status
      } = req.body


      /*
      |--------------------------------------------------------------------------
      | VALIDATE NAME
      |--------------------------------------------------------------------------
      */

      if (
        !name ||
        !name.trim()
      ) {

        return res.status(400).json({
          success: false,
          message:
            'Facility name is required'
        })
      }


      /*
      |--------------------------------------------------------------------------
      | VALIDATE DESCRIPTION
      |--------------------------------------------------------------------------
      */

      if (
        !description ||
        !description.trim()
      ) {

        return res.status(400).json({
          success: false,
          message:
            'Facility description or history is required'
        })
      }


      /*
      |--------------------------------------------------------------------------
      | VALIDATE LOCATION
      |--------------------------------------------------------------------------
      */

      if (
        !location ||
        !location.trim()
      ) {

        return res.status(400).json({
          success: false,
          message:
            'Facility location is required'
        })
      }


      /*
      |--------------------------------------------------------------------------
      | VALIDATE CAPACITY
      |--------------------------------------------------------------------------
      */

      const numericCapacity =
        Number(capacity)


      if (
        !Number.isInteger(numericCapacity) ||
        numericCapacity <= 0
      ) {

        return res.status(400).json({
          success: false,
          message:
            'Capacity must be a positive whole number'
        })
      }


      /*
      |--------------------------------------------------------------------------
      | GET EXISTING FACILITY
      |--------------------------------------------------------------------------
      */

      const existingFacility =
        await pool.query(
          `
          SELECT
            id,
            name,
            description,
            image_url,
            location,
            capacity,
            status
          FROM facilities
          WHERE id = $1
          `,
          [facilityId]
        )


      if (
        existingFacility.rows.length === 0
      ) {

        return res.status(404).json({
          success: false,
          message:
            'Facility not found'
        })
      }


      const oldFacility =
        existingFacility.rows[0]


      /*
      |--------------------------------------------------------------------------
      | CHECK DUPLICATE NAME
      |--------------------------------------------------------------------------
      */

      const duplicateFacility =
        await pool.query(
          `
          SELECT id
          FROM facilities
          WHERE LOWER(name) = LOWER($1)
          AND id <> $2
          `,
          [
            name.trim(),
            facilityId
          ]
        )


      if (
        duplicateFacility.rows.length > 0
      ) {

        return res.status(409).json({
          success: false,
          message:
            'A facility with this name already exists'
        })
      }


      /*
      |--------------------------------------------------------------------------
      | KEEP OLD IMAGE IF NO NEW IMAGE
      |--------------------------------------------------------------------------
      */

      const imageUrl =
        req.file
          ? `/uploads/facilities/${req.file.filename}`
          : oldFacility.image_url


      /*
      |--------------------------------------------------------------------------
      | FACILITY STATUS
      |--------------------------------------------------------------------------
      */

      const facilityStatus =
        status || oldFacility.status


      /*
      |--------------------------------------------------------------------------
      | UPDATE FACILITY
      |--------------------------------------------------------------------------
      */

      const updatedFacilityResult =
        await pool.query(
          `
          UPDATE facilities
          SET
            name = $1,
            description = $2,
            image_url = $3,
            location = $4,
            capacity = $5,
            status = $6
          WHERE id = $7
          RETURNING
            id,
            name,
            description,
            image_url,
            location,
            capacity,
            status
          `,
          [
            name.trim(),
            description.trim(),
            imageUrl,
            location.trim(),
            numericCapacity,
            facilityStatus,
            facilityId
          ]
        )


      const updatedFacility =
        updatedFacilityResult.rows[0]


      /*
      |--------------------------------------------------------------------------
      | AUDIT LOG
      |--------------------------------------------------------------------------
      */

      await logAudit({

        userId:
          req.user!.userId,

        action:
          'UPDATE',

        module:
          'FACILITY',

        entityType:
          'Facility',

        entityId:
          facilityId,

        description:
          `Updated facility: ${updatedFacility.name}`,

        oldValues: {

          name:
            oldFacility.name,

          description:
            oldFacility.description,

          imageUrl:
            oldFacility.image_url,

          location:
            oldFacility.location,

          capacity:
            oldFacility.capacity,

          status:
            oldFacility.status
        },

        newValues: {

          name:
            updatedFacility.name,

          description:
            updatedFacility.description,

          imageUrl:
            updatedFacility.image_url,

          location:
            updatedFacility.location,

          capacity:
            updatedFacility.capacity,

          status:
            updatedFacility.status
        },

        ipAddress:
          req.ip,

        userAgent:
          req.get('user-agent')
      })


      /*
      |--------------------------------------------------------------------------
      | RETURN SUCCESS
      |--------------------------------------------------------------------------
      */

      return res.json({

        success: true,

        message:
          'Facility updated successfully',

        data:
          updatedFacility
      })

    } catch (error: unknown) {

      console.error(
        'Error updating facility:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Failed to update facility'
      })
    }
  }
)


/*
|--------------------------------------------------------------------------
| CHANGE FACILITY STATUS
|--------------------------------------------------------------------------
*/

router.patch(
  '/:id/status',
  requirePermission('facility.edit'),
  async (
    req: AuthenticatedRequest,
    res
  ) => {

    try {

      const facilityId =
        Number(req.params.id)


      if (Number.isNaN(facilityId)) {

        return res.status(400).json({
          success: false,
          message:
            'Invalid facility ID'
        })
      }


      const { status } =
        req.body


      if (
        !status ||
        !status.trim()
      ) {

        return res.status(400).json({
          success: false,
          message:
            'Status is required'
        })
      }


      /*
      |--------------------------------------------------------------------------
      | GET CURRENT FACILITY
      |--------------------------------------------------------------------------
      */

      const existingFacility =
        await pool.query(
          `
          SELECT
            id,
            name,
            description,
            image_url,
            location,
            capacity,
            status
          FROM facilities
          WHERE id = $1
          `,
          [facilityId]
        )


      if (
        existingFacility.rows.length === 0
      ) {

        return res.status(404).json({
          success: false,
          message:
            'Facility not found'
        })
      }


      const oldFacility =
        existingFacility.rows[0]


      /*
      |--------------------------------------------------------------------------
      | UPDATE STATUS
      |--------------------------------------------------------------------------
      */

      const result =
        await pool.query(
          `
          UPDATE facilities
          SET status = $1
          WHERE id = $2
          RETURNING
            id,
            name,
            description,
            image_url,
            location,
            capacity,
            status
          `,
          [
            status.trim(),
            facilityId
          ]
        )


      const updatedFacility =
        result.rows[0]


      /*
      |--------------------------------------------------------------------------
      | DETERMINE AUDIT ACTION
      |--------------------------------------------------------------------------
      */

      const auditAction =
        updatedFacility.status
          .toLowerCase() === 'available'
          ? 'ENABLE'
          : 'DISABLE'


      /*
      |--------------------------------------------------------------------------
      | AUDIT LOG
      |--------------------------------------------------------------------------
      */

      await logAudit({

        userId:
          req.user!.userId,

        action:
          auditAction,

        module:
          'FACILITY',

        entityType:
          'Facility',

        entityId:
          facilityId,

        description:
          updatedFacility.status
            .toLowerCase() === 'available'
            ? `Enabled facility: ${updatedFacility.name}`
            : `Disabled facility: ${updatedFacility.name}`,

        oldValues: {

          status:
            oldFacility.status
        },

        newValues: {

          status:
            updatedFacility.status
        },

        ipAddress:
          req.ip,

        userAgent:
          req.get('user-agent')
      })


      return res.json({

        success: true,

        message:
          'Facility status updated successfully',

        data:
          updatedFacility
      })

    } catch (error: unknown) {

      console.error(
        'Error updating facility status:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Failed to update facility status'
      })
    }
  }
)


/*
|--------------------------------------------------------------------------
| DELETE FACILITY
|--------------------------------------------------------------------------
*/

router.delete(
  '/:id',
  requirePermission('facility.delete'),
  async (
    req: AuthenticatedRequest,
    res
  ) => {

    try {

      const facilityId =
        Number(req.params.id)


      if (Number.isNaN(facilityId)) {

        return res.status(400).json({
          success: false,
          message:
            'Invalid facility ID'
        })
      }


      /*
      |--------------------------------------------------------------------------
      | GET FACILITY
      |--------------------------------------------------------------------------
      */

      const facilityResult =
        await pool.query(
          `
          SELECT
            id,
            name,
            description,
            image_url,
            location,
            capacity,
            status
          FROM facilities
          WHERE id = $1
          `,
          [facilityId]
        )


      if (
        facilityResult.rows.length === 0
      ) {

        return res.status(404).json({
          success: false,
          message:
            'Facility not found'
        })
      }


      const oldFacility =
        facilityResult.rows[0]


      /*
      |--------------------------------------------------------------------------
      | CHECK RESERVATION HISTORY
      |--------------------------------------------------------------------------
      */

      const reservationResult =
        await pool.query(
          `
          SELECT COUNT(*) AS count
          FROM reservations
          WHERE facility_id = $1
          `,
          [facilityId]
        )


      const reservationCount =
        Number(
          reservationResult.rows[0].count
        )


      if (reservationCount > 0) {

        return res.status(409).json({
          success: false,
          message:
            'This facility cannot be deleted because it has reservation history. Deactivate it instead.'
        })
      }


      /*
      |--------------------------------------------------------------------------
      | DELETE
      |--------------------------------------------------------------------------
      */

      await pool.query(
        `
        DELETE FROM facilities
        WHERE id = $1
        `,
        [facilityId]
      )


      /*
      |--------------------------------------------------------------------------
      | AUDIT LOG
      |--------------------------------------------------------------------------
      */

      await logAudit({

        userId:
          req.user!.userId,

        action:
          'DELETE',

        module:
          'FACILITY',

        entityType:
          'Facility',

        entityId:
          facilityId,

        description:
          `Deleted facility: ${oldFacility.name}`,

        oldValues: {

          name:
            oldFacility.name,

          description:
            oldFacility.description,

          imageUrl:
            oldFacility.image_url,

          location:
            oldFacility.location,

          capacity:
            oldFacility.capacity,

          status:
            oldFacility.status
        },

        ipAddress:
          req.ip,

        userAgent:
          req.get('user-agent')
      })


      return res.json({

        success: true,

        message:
          'Facility deleted successfully'
      })

    } catch (error: unknown) {

      console.error(
        'Error deleting facility:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Failed to delete facility'
      })
    }
  }
)


export default router