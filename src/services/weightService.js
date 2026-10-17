import { dailyRecordService } from './dailyRecordService';
import { localDate } from '../../shared/dailyRecords';

export const weightService = {
  getWeightRecords: async farmId => {
    const data=await dailyRecordService.load(farmId||'');
    return data.records.filter(r=>r.category==='weight'&&r.status==='Recorded').map(r=>({...r.values,id:r.id,flockId:r.flockId,date:r.date,updatedAt:r.updatedAt,farmId:r.farmId}));
  },

  addWeightRecord: (record) => {
    return dailyRecordService.save({farmId:record.farmId,flockId:record.flockId,date:record.date||localDate(),category:'weight',requestKey:record.requestKey||crypto.randomUUID(),values:{sampleSize:Number(record.sampleSize),totalWeightKg:Number(record.averageWeightKg)*Number(record.sampleSize),measurement:'Sample',notes:record.notes||''}});
  },

  deleteWeightRecord: async (id) => {
    const {records}=await dailyRecordService.load('');
    const record=records.find(r=>r.id===id&&r.category==='weight');
    if(!record)throw new Error('Weight record not found.');
    return dailyRecordService.remove(record);
  }
};
