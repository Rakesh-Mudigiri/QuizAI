import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// ---PROPS---
interface SlideToUnlockProps {
  children: React.ReactNode;
  onUnlock: () => void;
  sliderText?: string;
  unlockedContent: React.ReactNode;
  className?: string;
  shimmer?: boolean;
}

// ---COMPONENT---
export const SlideToUnlock = ({
  children,
  onUnlock,
  sliderText = 'Swipe to open the gift',
  unlockedContent,
  className,
  shimmer = true,
}: SlideToUnlockProps) => {
  const [unlocked, setUnlocked] = useState(false);
  const [dragConstraint, setDragConstraint] = useState(0);
  const x = useMotionValue(0);

  const sliderRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  // Effect to calculate the correct drag constraint after the component mounts
  useEffect(() => {
    const sliderWidth = sliderRef.current?.offsetWidth || 0;
    const handleWidth = handleRef.current?.offsetWidth || 0;
    setDragConstraint(sliderWidth - handleWidth);
  }, []);

  // When the drag ends or click happens, unlock
  const triggerUnlock = () => {
    setUnlocked(true);
    onUnlock();
  };

  const onDragEnd = (event: any, info: any) => {
    const threshold = dragConstraint > 0 ? dragConstraint * 0.3 : 40;
    if (info.offset.x > threshold) {
      triggerUnlock();
    } else {
      x.set(0);
    }
  };

  const textOpacity = useTransform(x, [0, 50], [1, 0]);

  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'hidden', padding: '10px 0' }}>
      {children}
      <AnimatePresence mode="wait">
        {!unlocked ? (
          <motion.div
            key="slider"
            initial={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            style={{ position: 'relative', marginTop: '16px' }}
          >
            <div 
              ref={sliderRef} 
              onClick={triggerUnlock}
              style={{
                position: 'relative',
                height: '56px',
                width: '100%',
                cursor: 'pointer',
                borderRadius: '9999px',
                background: '#F1F5F9',
                border: '1.5px solid #E2E8F0',
                userSelect: 'none',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)'
              }}
            >
              <motion.div
                ref={handleRef}
                drag="x"
                dragConstraints={{ left: 0, right: dragConstraint || 220 }}
                dragElastic={0.1}
                style={{
                  x,
                  position: 'absolute',
                  left: 0,
                  top: '-1px',
                  zIndex: 10,
                  display: 'flex',
                  height: '56px',
                  width: '56px',
                  cursor: 'grab',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '9999px',
                  background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                }}
                onDragEnd={onDragEnd}
                onClick={(e) => {
                  e.stopPropagation();
                  triggerUnlock();
                }}
              >
                <ChevronRightIcon style={{ height: '24px', width: '24px', color: '#FFFFFF' }} />
              </motion.div>
              <motion.span
                style={{
                  opacity: textOpacity,
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#059669',
                  paddingLeft: '40px',
                  letterSpacing: '0.2px'
                }}
              >
                {sliderText}
              </motion.span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="unlocked"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {unlockedContent}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ---ICON---
const ChevronRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);
