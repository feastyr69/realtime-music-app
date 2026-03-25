import React from 'react'

const Form = ({ recordData, handleChange, handleSubmit, isUpdating, setIsUpdating, setRecordData }) => {
  const exitEditing = () => {
    setIsUpdating(false);
    setRecordData({
      Subject: '',
      AttendedClasses: '',
      TotalClasses: '',
      Criteria: ''
    });
  };

  const inputClasses = "w-full px-4 py-3 text-white bg-white/5 border border-white/10 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 rounded-xl transition-all duration-300 placeholder:text-slate-500 shadow-inner";
  const labelClasses = "text-slate-300 text-sm font-semibold ml-1 mb-1 tracking-wide";

  const btnClasses = "h-12 px-6 rounded-xl font-bold transition-all duration-300 shadow-lg cursor-pointer flex items-center justify-center tracking-wide";

  return (
    <div className='w-full flex flex-col items-center py-5 relative z-10'>
      <div className="w-full flex flex-col gap-5 p-8 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <div className='w-full flex flex-col'>
          <label className={labelClasses}>Subject Name</label>
          <input type="text" placeholder='e.g., Data Structures' name='Subject' value={recordData.Subject} onChange={handleChange} className={inputClasses} />
        </div>
        <div className='w-full flex gap-4 mt-2'>
          <div className='w-1/2 flex flex-col'>
            <label className={labelClasses}>Attended Classes</label>
            <input type="number" placeholder='0' name='AttendedClasses' value={recordData.AttendedClasses} onChange={handleChange} className={inputClasses} />
          </div>
          <div className='w-1/2 flex flex-col'>
            <label className={labelClasses}>Total Classes</label>
            <input type="number" placeholder='0' name='TotalClasses' value={recordData.TotalClasses} onChange={handleChange} className={inputClasses} />
          </div>
        </div>
        <div className='w-full flex flex-col mt-2'>
          <label className={labelClasses}>Criteria</label>
          <input type="number" placeholder='75' name='Criteria' value={recordData.Criteria} onChange={handleChange} className={inputClasses} />
        </div>
        <div className='w-full flex justify-between items-center mt-6 gap-4'>
          {isUpdating && (
            <button className={`${btnClasses} bg-white/5 hover:bg-white/10 text-rose-400 border border-rose-500/20 hover:border-rose-500/50 w-[40%]`} onClick={exitEditing}>
              Cancel
            </button>
          )}
          <button className={`${btnClasses} bg-linear-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white border-none flex-1 shadow-cyan-500/20 hover:shadow-cyan-500/40`} onClick={handleSubmit}>
            {isUpdating ? 'Update Record' : 'Add Record'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Form
