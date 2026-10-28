import { ImageResponse } from 'next/og'

export const alt = 'Hádači.cz – Denní vědomostní dedukce'
export const size = {
    width: 1200,
    height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#020617',
                    border: '16px solid #0f172a',
                    fontFamily: 'sans-serif',
                    position: 'relative',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage:
                            'radial-gradient(circle at 50% 40%, rgba(245, 158, 11, 0.12), transparent 70%)',
                    }}
                />

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px',
                        marginBottom: '24px',
                        zIndex: 10,
                    }}
                >
                    <div style={{ fontSize: 80 }}>🕵️‍♂️</div>
                    <div
                        style={{
                            fontSize: 84,
                            fontWeight: 900,
                            color: '#fbbf24',
                            letterSpacing: '-2px',
                        }}
                    >
                        Hádači.cz
                    </div>
                </div>

                <div
                    style={{
                        fontSize: 36,
                        fontWeight: 700,
                        color: '#f8fafc',
                        marginBottom: '16px',
                        textAlign: 'center',
                        zIndex: 10,
                    }}
                >
                    Denní vědomostní dedukce
                </div>

                <div
                    style={{
                        fontSize: 22,
                        color: '#94a3b8',
                        maxWidth: '820px',
                        textAlign: 'center',
                        lineHeight: 1.4,
                        zIndex: 10,
                    }}
                >
                    Uhádni osobnost, památku či vynález na co nejméně stop dřív než umělá inteligence.
                </div>

                <div
                    style={{
                        display: 'flex',
                        gap: '16px',
                        marginTop: '44px',
                        zIndex: 10,
                    }}
                >
                    <div
                        style={{
                            backgroundColor: 'rgba(245, 158, 11, 0.15)',
                            border: '2px solid rgba(245, 158, 11, 0.4)',
                            color: '#fbbf24',
                            padding: '10px 24px',
                            borderRadius: '9999px',
                            fontSize: 20,
                            fontWeight: 700,
                        }}
                    >
                        🔍 5 postupných stop
                    </div>
                    <div
                        style={{
                            backgroundColor: 'rgba(99, 102, 241, 0.15)',
                            border: '2px solid rgba(99, 102, 241, 0.4)',
                            color: '#818cf8',
                            padding: '10px 24px',
                            borderRadius: '9999px',
                            fontSize: 20,
                            fontWeight: 700,
                        }}
                    >
                        🤖 Souboj s AI modely
                    </div>
                    <div
                        style={{
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            border: '2px solid rgba(16, 185, 129, 0.4)',
                            color: '#34d399',
                            padding: '10px 24px',
                            borderRadius: '9999px',
                            fontSize: 20,
                            fontWeight: 700,
                        }}
                    >
                        🏆 Síň slávy
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
        }
    )
}