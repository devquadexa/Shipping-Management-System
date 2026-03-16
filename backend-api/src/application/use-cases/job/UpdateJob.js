/**
 * Update Job Use Case
 * Updates job details like BL Number, CUSDEC Number, LC Number, Container Number, Transporter
 */
class UpdateJob {
  constructor(jobRepository) {
    this.jobRepository = jobRepository;
  }

  async execute(jobId, jobData) {
    try {
      console.log('UpdateJob.execute - START');
      console.log('UpdateJob.execute - jobId:', jobId);
      console.log('UpdateJob.execute - jobData:', JSON.stringify(jobData, null, 2));
      
      // Validate jobId
      if (!jobId) {
        throw new Error('Job ID is required');
      }
      
      // Validate jobData
      if (!jobData || typeof jobData !== 'object') {
        throw new Error('Invalid job data provided');
      }
      
      const existingJob = await this.jobRepository.findById(jobId);
      console.log('UpdateJob.execute - existingJob:', JSON.stringify(existingJob, null, 2));
      
      if (!existingJob) {
        console.log('UpdateJob.execute - Job not found');
        throw new Error(`Job with ID ${jobId} not found`);
      }
      
      // Handle date conversion if openDate is provided
      let processedOpenDate = existingJob.openDate;
      if (jobData.openDate !== undefined && jobData.openDate !== null && jobData.openDate !== '') {
        try {
          // Convert string date to Date object if needed
          processedOpenDate = new Date(jobData.openDate);
          // Validate the date
          if (isNaN(processedOpenDate.getTime())) {
            throw new Error('Invalid date format for openDate');
          }
          console.log('UpdateJob.execute - processed openDate:', processedOpenDate);
        } catch (dateError) {
          console.error('UpdateJob.execute - Date conversion error:', dateError);
          throw new Error('Invalid date format for openDate');
        }
      }
      
      // Create updated job object with existing values as defaults
      const updatedJob = {
        jobId: existingJob.jobId,
        customerId: existingJob.customerId,
        blNumber: jobData.blNumber !== undefined ? (jobData.blNumber || null) : existingJob.blNumber,
        cusdecNumber: jobData.cusdecNumber !== undefined ? (jobData.cusdecNumber || null) : existingJob.cusdecNumber,
        openDate: jobData.openDate !== undefined ? processedOpenDate : existingJob.openDate,
        shipmentCategory: jobData.shipmentCategory !== undefined ? jobData.shipmentCategory : existingJob.shipmentCategory,
        exporter: jobData.exporter !== undefined ? (jobData.exporter || null) : existingJob.exporter,
        lcNumber: jobData.lcNumber !== undefined ? (jobData.lcNumber || null) : existingJob.lcNumber,
        containerNumber: jobData.containerNumber !== undefined ? (jobData.containerNumber || null) : existingJob.containerNumber,
        transporter: jobData.transporter !== undefined ? (jobData.transporter || null) : existingJob.transporter,
        status: jobData.status !== undefined ? jobData.status : existingJob.status
      };
      
      // Validate required fields
      if (!updatedJob.customerId) {
        throw new Error('Customer ID is required');
      }
      if (!updatedJob.shipmentCategory) {
        throw new Error('Shipment Category is required');
      }
      
      console.log('UpdateJob.execute - updatedJob:', JSON.stringify(updatedJob, null, 2));
      
      // Persist through repository
      console.log('UpdateJob.execute - calling repository.update');
      await this.jobRepository.update(jobId, updatedJob);
      console.log('UpdateJob.execute - repository.update completed');
      
      const result = await this.jobRepository.findById(jobId);
      console.log('UpdateJob.execute - final result:', JSON.stringify(result, null, 2));
      console.log('UpdateJob.execute - END');
      
      return result;
    } catch (error) {
      console.error('UpdateJob.execute - ERROR:', error);
      console.error('UpdateJob.execute - ERROR stack:', error.stack);
      throw error;
    }
  }
}

module.exports = UpdateJob;
