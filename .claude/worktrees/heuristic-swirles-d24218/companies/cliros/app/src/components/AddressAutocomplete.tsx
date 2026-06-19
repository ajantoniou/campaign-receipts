"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface AddressSuggestion {
  formattedAddress: string;
  mainText: string;
  secondaryText: string;
  placeId?: string;
  county?: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: AddressSuggestion) => void;
  onCountyDetected?: (county: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || "";

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  onCountyDetected,
  placeholder = "Enter a property address (e.g. 123 Main St, Atlanta, GA)",
  className = "",
  inputClassName = "",
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [skipNextFetch, setSkipNextFetch] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const sessionTokenRef = useRef<string>(crypto.randomUUID());

  // Fetch suggestions from Google Places Autocomplete (New)
  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (!GOOGLE_KEY || query.length < 4) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      try {
        const res = await fetch(
          "https://places.googleapis.com/v1/places:autocomplete",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": GOOGLE_KEY,
            },
            body: JSON.stringify({
              input: query,
              includedPrimaryTypes: ["street_address", "subpremise", "premise"],
              includedRegionCodes: ["us"],
              sessionToken: sessionTokenRef.current,
            }),
          }
        );

        if (!res.ok) return;

        const data = await res.json();
        const results: AddressSuggestion[] = (data.suggestions || [])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((s: any) => s.placePrediction)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .slice(0, 5)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((s: any) => ({
            formattedAddress: s.placePrediction.text?.text || "",
            mainText:
              s.placePrediction.structuredFormat?.mainText?.text || "",
            secondaryText:
              s.placePrediction.structuredFormat?.secondaryText?.text || "",
            placeId: s.placePrediction.placeId || "",
          }));

        setSuggestions(results);
        setShowDropdown(results.length > 0);
        setHighlightIndex(-1);
      } catch {
        // Silently fail — autocomplete is a nice-to-have
      }
    },
    []
  );

  // Debounced input handler
  useEffect(() => {
    if (skipNextFetch) {
      setSkipNextFetch(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, fetchSuggestions, skipNextFetch]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSelect(suggestion: AddressSuggestion) {
    setSkipNextFetch(true);
    onChange(suggestion.formattedAddress);
    setShowDropdown(false);
    setSuggestions([]);
    // Rotate session token after selection (Google bills per-session)
    const oldToken = sessionTokenRef.current;
    sessionTokenRef.current = crypto.randomUUID();
    onSelect?.(suggestion);

    // Fetch Place Details to extract county (administrative_area_level_2)
    if (suggestion.placeId && GOOGLE_KEY && onCountyDetected) {
      try {
        const res = await fetch(
          `https://places.googleapis.com/v1/places/${suggestion.placeId}?fields=addressComponents&sessionToken=${oldToken}`,
          {
            headers: {
              "X-Goog-Api-Key": GOOGLE_KEY,
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          const countyComponent = (data.addressComponents || []).find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (c: any) => c.types?.includes("administrative_area_level_2")
          );
          if (countyComponent) {
            // Strip " County" suffix if present (Google returns "Fulton County")
            const countyName = (countyComponent.longText || countyComponent.shortText || "")
              .replace(/\s+County$/i, "");
            if (countyName) {
              onCountyDetected(countyName);
            }
          }
        }
      } catch {
        // County detection is best-effort — user can still select manually
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[highlightIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setShowDropdown(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={inputClassName}
        autoComplete="off"
        role="combobox"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
      />

      {showDropdown && suggestions.length > 0 && (
        <ul
          className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg overflow-hidden"
          role="listbox"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.formattedAddress + i}
              role="option"
              aria-selected={i === highlightIndex}
              className={`px-4 py-3 text-sm cursor-pointer transition-colors ${
                i === highlightIndex
                  ? "bg-primary/10 text-foreground"
                  : "text-foreground hover:bg-card"
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(s);
              }}
              onMouseEnter={() => setHighlightIndex(i)}
            >
              <span className="font-medium">{s.mainText}</span>
              {s.secondaryText && (
                <span className="text-muted ml-1">{s.secondaryText}</span>
              )}
            </li>
          ))}
          <li className="px-4 py-2 text-xs text-muted/60 border-t border-border bg-card">
            Powered by Google
          </li>
        </ul>
      )}
    </div>
  );
}
