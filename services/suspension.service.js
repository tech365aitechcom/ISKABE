const User = require('../models/user.model')
const Suspension = require('../models/suspension.model')

// Service to handle suspension-related operations
class SuspensionService {
  
  // Update expired suspensions and user suspension status
  static async updateExpiredSuspensions() {
    try {
      const currentDate = new Date()
      
      // Find all active suspensions
      const activeSuspensions = await Suspension.find({ status: 'Active' })
      
      const expiredSuspensionIds = []
      const usersToUpdate = new Set()
      
      for (const suspension of activeSuspensions) {
        let isExpired = false
        
        // Skip indefinite suspensions
        if (suspension.indefinite) {
          continue
        }
        
        // Skip medical suspensions without clearance
        if (suspension.type === 'Medical' && !suspension.medicalClearance) {
          continue
        }
        
        const daysSinceIncident = Math.floor(
          (currentDate - new Date(suspension.incidentDate)) / (1000 * 60 * 60 * 24)
        )
        
        // Check if training suspension has expired
        if (suspension.daysWithoutTraining && daysSinceIncident >= suspension.daysWithoutTraining) {
          isExpired = true
        }
        
        // Check if competition suspension has expired
        if (suspension.daysBeforeCompeting && daysSinceIncident >= suspension.daysBeforeCompeting) {
          isExpired = true
        }
        
        if (isExpired) {
          expiredSuspensionIds.push(suspension._id)
          usersToUpdate.add(suspension.person.toString())
        }
      }
      
      // Close expired suspensions
      if (expiredSuspensionIds.length > 0) {
        await Suspension.updateMany(
          { _id: { $in: expiredSuspensionIds } },
          { status: 'Closed' }
        )
        
        console.log(`Closed ${expiredSuspensionIds.length} expired suspensions`)
      }
      
      // Update user suspension status for affected users
      if (usersToUpdate.size > 0) {
        for (const userId of usersToUpdate) {
          // Check if user still has any active suspensions
          const remainingActiveSuspensions = await Suspension.find({
            person: userId,
            status: 'Active'
          })
          
          // If no active suspensions remain, update user.isSuspended to false
          if (remainingActiveSuspensions.length === 0) {
            await User.findByIdAndUpdate(userId, { isSuspended: false })
          }
        }
        
        console.log(`Updated suspension status for ${usersToUpdate.size} users`)
      }
      
      return {
        expiredSuspensions: expiredSuspensionIds.length,
        updatedUsers: usersToUpdate.size
      }
      
    } catch (error) {
      console.error('Error updating expired suspensions:', error)
      throw error
    }
  }
  
  // Check if user has any active suspensions
  static async hasActiveSuspensions(userId) {
    try {
      const activeSuspensions = await Suspension.find({
        person: userId,
        status: 'Active'
      })
      
      const currentDate = new Date()
      
      for (const suspension of activeSuspensions) {
        // Indefinite suspensions are always active
        if (suspension.indefinite) {
          return true
        }
        
        // Medical suspensions without clearance are active
        if (suspension.type === 'Medical' && !suspension.medicalClearance) {
          return true
        }
        
        const daysSinceIncident = Math.floor(
          (currentDate - new Date(suspension.incidentDate)) / (1000 * 60 * 60 * 24)
        )
        
        // Check if training suspension is still active
        if (suspension.daysWithoutTraining && daysSinceIncident < suspension.daysWithoutTraining) {
          return true
        }
        
        // Check if competition suspension is still active
        if (suspension.daysBeforeCompeting && daysSinceIncident < suspension.daysBeforeCompeting) {
          return true
        }
      }
      
      return false
      
    } catch (error) {
      console.error('Error checking active suspensions:', error)
      throw error
    }
  }
  
  // Run cleanup job - can be called by cron job or scheduler
  static async runCleanupJob() {
    try {
      console.log('Starting suspension cleanup job...')
      const result = await this.updateExpiredSuspensions()
      console.log(`Suspension cleanup completed: ${result.expiredSuspensions} suspensions closed, ${result.updatedUsers} users updated`)
      return result
    } catch (error) {
      console.error('Suspension cleanup job failed:', error)
      throw error
    }
  }
}

module.exports = SuspensionService