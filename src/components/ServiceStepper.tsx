import React from 'react';
import { Check } from 'lucide-react';

interface TimelineItem {
  status: string;
  waktuUpdate: string;
}

interface ServiceStepperProps {
  timeline: TimelineItem[];
}

interface Step {
  id: number;
  label: string;
  type: 'major' | 'minor';
}

const steps: Step[] = [
  { id: 1, label: 'DITERIMA', type: 'major' },
  { id: 2, label: 'BELUM CEK', type: 'minor' },
  { id: 3, label: 'SEDANG CEK', type: 'minor' },
  { id: 4, label: 'KONFIRMASI USER', type: 'major' },
  { id: 5, label: 'DIKERJAKAN/ CLAIM GARANSI', type: 'minor' },
  { id: 6, label: 'BISA DIAMBIL', type: 'minor' },
  { id: 7, label: 'DIAMBIL USER', type: 'major' },
];

const ServiceStepper: React.FC<ServiceStepperProps> = ({ timeline }) => {
  
  const getActiveStepNumber = (timelineData: TimelineItem[]): number => {
    if (!timelineData || timelineData.length === 0) return 1;
    const latestStatus = timelineData[0].status;

    switch (latestStatus) {
      case "Sudah Diambil":
        return 8; // Adjust based on your parent logic if this goes up to 8
      case "Bisa Diambil":
        return 6;
      case "Sedang Tes":
        return 6;
      case "Sedang Dikerjakan":
      case "DITANGANI DISTRIBUTOR/KLAIM GARANSI":
        return 5;
      case "Sedang Cek":
        return 3;
      case "Belum Cek":
        return 2;
      default:
        return 1;
    }
  };

  const currentActiveStep = getActiveStepNumber(timeline);

  return (
    // 1. ADDED: overflow-x-auto allows horizontal scrolling on small screens
    <div className="w-full py-8 overflow-x-auto scrollbar-hide">
      
      {/* 2. ADDED: min-w-[700px] forces the stepper to stay wide enough so text never overlaps */}
      {/* On mobile, it scrolls. On md (desktop) screens, it takes up the full width. */}
      <div className="min-w-[700px] md:min-w-full px-4 md:px-2 pb-8">
        
        <div className="relative flex items-center justify-between w-full">
          
          {/* Background gray line */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 rounded-full" />
          
          {/* Green active progress line */}
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-green-600 transition-all duration-700 ease-out -z-10 rounded-full"
            style={{ width: `${((currentActiveStep - 1) / (steps.length - 1)) * 100}%` }}
          />

          {steps.map((step) => {
            const isCompleted = step.id < currentActiveStep;
            const isActive = step.id === currentActiveStep;
            const isPending = step.id > currentActiveStep;

            return (
              <div key={step.id} className="flex flex-col items-center relative flex-1 group">
                
                {/* Circle Indicator */}
                <div 
                  className={`
                    flex items-center justify-center rounded-full transition-all duration-300 border-2
                    ${step.type === 'major' ? 'w-8 h-8 md:w-10 md:h-10' : 'w-5 h-5 md:w-6 md:h-6'}
                    ${isCompleted ? 'bg-green-600 border-green-600 text-white shadow-lg' : ''}
                    ${isActive ? 'bg-white border-blue-600 text-blue-600 ring-4 ring-blue-50 scale-105 shadow-md' : ''}
                    ${isPending ? 'bg-white border-gray-300 text-gray-400' : ''}
                  `}
                >
                  {isCompleted ? (
                    <Check 
                      className={step.type === 'major' ? 'w-5 h-5 md:w-6 md:h-6' : 'w-2.5 h-2.5 md:w-3 md:h-3'} 
                      strokeWidth={3} 
                    />
                  ) : (
                    <span className={`font-black ${step.type === 'major' ? 'text-xs md:text-sm' : 'text-[8px] md:text-[10px]'}`}>
                      {step.id}
                    </span>
                  )}
                </div>

                {/* Label Text */}
                {/* 3. ADDED: w-16 md:w-24 to force the text to wrap nicely into a box shape under the circle */}
                <div className="absolute top-full mt-3.5 flex flex-col items-center justify-start w-16 md:w-24 group-hover:scale-105 transition-transform duration-300">
                  <p 
                    className={`
                      text-center leading-tight transition-colors duration-300 break-words whitespace-normal
                      ${step.type === 'major' ? 'text-[9px] md:text-[11px] font-black' : 'text-[8px] md:text-[10px] font-bold'}
                      ${isCompleted ? 'text-gray-900 font-medium' : ''}
                      ${isActive ? 'text-blue-700' : ''}
                      ${isPending ? 'text-gray-400' : ''}
                    `}
                  >
                    {step.label}
                  </p>
                  
                  {isActive && timeline[0] && (
                    <p className="text-[7px] md:text-[9px] text-gray-500 mt-1 font-medium text-center hidden sm:block">
                      {timeline[0].waktuUpdate}
                    </p>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ServiceStepper;