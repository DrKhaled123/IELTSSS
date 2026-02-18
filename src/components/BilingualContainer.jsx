import React from 'react';

const BilingualContainer = ({ title, germanContent, englishContent }) => {
     // In IELTS app, we only display the 'englishContent' (which is passed as a prop)
     // essentially acting as a wrapper for the standard content.
     return (
          <div className="bilingual-wrapper animate-fadeIn" style={{ marginBottom: '24px' }}>
               {title && (
                    <h3 style={{ marginBottom: '16px', color: '#1f2937' }}>
                         {title}
                    </h3>
               )}
               <div className="card">
                    {englishContent}
               </div>
          </div>
     );
};

export default BilingualContainer;
