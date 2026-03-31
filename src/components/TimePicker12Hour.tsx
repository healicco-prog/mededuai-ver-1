import React from 'react';
import { Clock } from 'lucide-react';

interface TimePicker12HourProps {
    value: string;
    onChange: (val: string) => void;
    className?: string; // Wrapper wrapper classes
    title?: string;
}

export default function TimePicker12Hour({ value, onChange, className, title }: TimePicker12HourProps) {
    const parseInit = () => {
        if (!value) return { h: '09', m: '00', p: 'AM' };
        const [hh, mm] = value.split(':');
        let hInt = parseInt(hh, 10);
        if (isNaN(hInt)) hInt = 9;
        const p = hInt >= 12 ? 'PM' : 'AM';
        if (hInt === 0) hInt = 12;
        else if (hInt > 12) hInt -= 12;
        return {
            h: hInt.toString().padStart(2, '0'),
            m: (mm || '00').padStart(2, '0'),
            p
        };
    };

    const time = parseInit();

    const update = (h: string, m: string, p: string) => {
        let h24 = parseInt(h, 10);
        if (p === 'PM' && h24 < 12) h24 += 12;
        if (p === 'AM' && h24 === 12) h24 = 0;
        onChange(`${h24.toString().padStart(2, '0')}:${m}`);
    };

    return (
        <div title={title} className={`flex items-center px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-500 transition-all ${className || ''}`}>
            <Clock className="w-4 h-4 text-slate-400 mr-2 shrink-0 hidden sm:block" />
            <select 
                value={time.h} 
                onChange={e => update(e.target.value, time.m, time.p)}
                className="appearance-none bg-transparent font-bold text-slate-700 outline-none text-center cursor-pointer hover:bg-slate-200 rounded px-1"
            >
                {Array.from({length: 12}, (_, i) => {
                    const v = (i + 1).toString().padStart(2, '0');
                    return <option key={v} value={v}>{v}</option>;
                })}
            </select>
            <span className="font-bold text-slate-400 mx-0.5">:</span>
            <select 
                value={time.m} 
                onChange={e => update(time.h, e.target.value, time.p)}
                className="appearance-none bg-transparent font-bold text-slate-700 outline-none text-center cursor-pointer hover:bg-slate-200 rounded px-1"
            >
                {Array.from({length: 60}, (_, i) => {
                    const v = i.toString().padStart(2, '0');
                    return <option key={v} value={v}>{v}</option>;
                })}
            </select>
            <select 
                value={time.p} 
                onChange={e => update(time.h, time.m, e.target.value)}
                className="appearance-none bg-transparent font-bold text-slate-700 outline-none ml-1 cursor-pointer hover:bg-slate-200 rounded px-1"
            >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
            </select>
        </div>
    );
}
