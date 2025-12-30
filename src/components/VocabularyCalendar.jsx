import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Star, BookOpen } from 'lucide-react'

export default function VocabularyCalendar({ progress = [] }) {
     const [currentDate, setCurrentDate] = useState(new Date())
     const [selectedDate, setSelectedDate] = useState(new Date())

     const daysInMonth = (date) => {
          return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
     }

     const firstDayOfMonth = (date) => {
          return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
     }

     const monthData = useMemo(() => {
          const data = {}
          progress.forEach(item => {
               const date = new Date(item.timestamp).toDateString()
               if (!data[date]) data[date] = []
               data[date].push(item)
          })
          return data
     }, [progress])

     const generateCalendarDays = () => {
          const days = []
          const totalDays = daysInMonth(currentDate)
          const firstDay = firstDayOfMonth(currentDate)

          // Empty cells for previous month
          for (let i = 0; i < firstDay; i++) {
               days.push({ day: null, key: `prev-${i}` })
          }

          // Days of current month
          for (let i = 1; i <= totalDays; i++) {
               const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i)
               const dateString = date.toDateString()
               const hasActivity = monthData[dateString]?.length > 0
               days.push({
                    day: i,
                    date: date,
                    hasActivity,
                    activityCount: monthData[dateString]?.length || 0,
                    key: `curr-${i}`
               })
          }

          return days
     }

     const nextMonth = () => {
          setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
     }

     const prevMonth = () => {
          setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
     }

     const selectedDateActivity = monthData[selectedDate.toDateString()] || []

     return (
          <div className="card animate-fadeIn">
               <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <BookOpen size={24} />
                    Learning Calendar
               </h3>

               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 'var(--space-md) 0' }}>
                    <button className="btn btn-secondary" onClick={prevMonth}>
                         <ChevronLeft size={20} />
                    </button>
                    <div style={{ fontWeight: 'bold', fontSize: 'var(--font-lg)' }}>
                         {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </div>
                    <button className="btn btn-secondary" onClick={nextMonth}>
                         <ChevronRight size={20} />
                    </button>
               </div>

               <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: 'var(--space-xs)',
                    textAlign: 'center',
                    marginBottom: 'var(--space-md)'
               }}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                         <div key={day} style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-sm)', padding: 'var(--space-xs)' }}>
                              {day}
                         </div>
                    ))}

                    {generateCalendarDays().map(({ day, date, hasActivity, activityCount, key }) => (
                         <div
                              key={key}
                              onClick={() => day && setSelectedDate(date)}
                              style={{
                                   padding: 'var(--space-sm)',
                                   borderRadius: 'var(--radius-md)',
                                   cursor: day ? 'pointer' : 'default',
                                   background: day && selectedDate.toDateString() === date?.toDateString()
                                        ? 'var(--color-primary)'
                                        : hasActivity
                                             ? 'var(--color-surface-hover)'
                                             : 'transparent',
                                   color: day && selectedDate.toDateString() === date?.toDateString()
                                        ? 'white'
                                        : 'inherit',
                                   opacity: day ? 1 : 0,
                                   position: 'relative',
                                   border: day && hasActivity ? '1px solid var(--color-border)' : 'none'
                              }}
                         >
                              {day}
                              {hasActivity && (
                                   <div style={{
                                        position: 'absolute',
                                        bottom: '4px',
                                        right: '4px',
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        background: selectedDate.toDateString() === date?.toDateString() ? 'white' : 'var(--color-success)'
                                   }} />
                              )}
                         </div>
                    ))}
               </div>

               {/* Selected Date Details */}
               <div className="animate-fadeIn" style={{
                    borderTop: '1px solid var(--color-border)',
                    paddingTop: 'var(--space-md)',
                    marginTop: 'var(--space-md)'
               }}>
                    <h4 style={{ marginBottom: 'var(--space-sm)' }}>
                         Activity for {selectedDate.toLocaleDateString()}
                    </h4>

                    {selectedDateActivity.length > 0 ? (
                         <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
                              {selectedDateActivity.map((activity, idx) => (
                                   <div key={idx} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-sm)',
                                        padding: 'var(--space-sm)',
                                        background: 'var(--color-bg-elevated)',
                                        borderRadius: 'var(--radius-md)'
                                   }}>
                                        <Star size={16} color="var(--color-warning)" fill="var(--color-warning)" />
                                        <div>
                                             <span style={{ fontWeight: 'bold' }}>
                                                  {activity.data?.word || activity.data?.german || 'Activity'}
                                             </span>
                                             <span style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-xs)', marginLeft: 'var(--space-sm)' }}>
                                                  {activity.action.replace('_', ' ')}
                                             </span>
                                        </div>
                                   </div>
                              ))}
                         </div>
                    ) : (
                         <p style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                              No activity recorded for this day.
                         </p>
                    )}
               </div>
          </div>
     )
}
