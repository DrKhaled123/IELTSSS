import React from 'react';

const BilingualContainer = ({ title, germanContent, englishContent }) => {
     // In IELTS app, we only display the 'englishContent' (which is passed as a prop)
     // essentially acting as a wrapper for the standard content.
     return (
          <div className="bilingual-wrapper animate-fadeIn" style={{ marginBottom: 'var(--space-xl)' }}>
               {title && (
                    <h3 style={{ marginBottom: 'var(--space-lg)', color: 'var(--color-text)' }}>
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
