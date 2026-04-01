import Image from 'next/image';

interface MededuLogoProps {
  size?: number;      // px size of the logo box (default 40)
  className?: string;
}

/**
 * MedEduAI brand logo with slightly curved corners.
 * Drop-in replacement wherever BrainCircuit was used as the logo icon.
 */
export default function MededuLogo({ size = 40, className = '' }: MededuLogoProps) {
  return (
    <div
      className={`flex-shrink-0 overflow-hidden bg-white ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.22), // ~22% → ~9px at 40px, nicely curved
      }}
    >
      <Image
        src="/logo.png"
        alt="MedEduAI Logo"
        width={size}
        height={size}
        className="w-full h-full object-contain"
        priority
      />
    </div>
  );
}
