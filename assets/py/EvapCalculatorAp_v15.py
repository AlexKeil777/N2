import tkinter as tk
from tkinter import ttk
import numpy as np
from scipy.integrate import solve_ivp
import matplotlib.pyplot as plt
import csv
from tkinter import filedialog
from tkinter import messagebox

# ================================================================
# SHARED PHYSICAL CONSTANTS
# ================================================================
R_gas = 8.314
A_surf = 100e-4           # m2 (10x10 cm)
M1 = 34.015e-3            # kg/mol H2O2
M2 = 18.015e-3            # kg/mol H2O
A12m = -0.40              # Margules H2O2 in H2O (Scatchard 1952)
A21m = -0.22              # Margules H2O in H2O2
H2O2_pref = 5.0 * 133.322 # Pa (5.0 mmHg @ 30C, Giguere & Maass 1940)
H2O2_Tref = 303.15        # K
H2O2_HvR = 11590          # K dHvap/R
D_Tref = 298.15           # K diffusivity reference T


class EvapCalculatorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("H2O2/H2O Evaporation Rate Calculator v15")
        
        # Dimensions based on MATLAB script
        FW, FH = 1280, 962
        self.root.geometry(f"{FW}x{FH}+40+40")
        self.root.configure(bg="#1a1e29")
        self.root.resizable(False, False)

        # ================================================================
        # CURVES STATE — v15 MULTI-CHANNEL
        # ================================================================
        self.crv_channels = ['T_liq', 'T_air', 'RH', 'P']
        self.crv_meta = [
            {'unit': 'C',  'ylim': [1, 100],      'default': 25,     'ylabel': 'T_liq [°C]'},
            {'unit': 'C',  'ylim': [1, 100],      'default': 25,     'ylabel': 'T_air [°C]'},
            {'unit': '%',  'ylim': [0, 100],      'default': 50,     'ylabel': 'RH [%]'},
            {'unit': 'Pa', 'ylim': [1000, 500000],'default': 101325, 'ylabel': 'P [Pa]'}
        ]
        
        self.crv_data = []
        for i in range(4):
            default_val = self.crv_meta[i]['default']
            self.crv_data.append({
                'cx': [0, 3600],
                'cy': [default_val, default_val],
                'vec': np.ones(61) * default_val  # 3600s / 60s
            })
            
        self.crv_active = 0
        
        self.build_gui()

    def build_gui(self):
        """Constructs the exact layout from the MATLAB specs"""
        LX, LW = 10, 560
        FW, FH = 1280, 962
        
        # ---- MODE SELECTOR y=664 h=54 ----
        mode_frame = tk.LabelFrame(self.root, text=" CALCULATION MODE ", bg="#242b38", fg="#99ccff", font=('Arial', 9, 'bold'))
        mode_frame.place(x=LX, y=FH - 664 - 54, width=LW, height=54)
        
        self.mode_var = tk.StringVar(value="A")
        tk.Radiobutton(mode_frame, text="A Hertz-Knudsen", variable=self.mode_var, value="A", 
                       bg="#242b38", fg="#8cf28c", selectcolor="#242b38").place(x=2, y=5)
        tk.Radiobutton(mode_frame, text="B Stefan/Fick", variable=self.mode_var, value="B", 
                       bg="#242b38", fg="#8cc2ff", selectcolor="#242b38").place(x=144, y=5)
        tk.Radiobutton(mode_frame, text="C Wilke D_eff", variable=self.mode_var, value="C", 
                       bg="#242b38", fg="#ffd666", selectcolor="#242b38").place(x=278, y=5)
        tk.Radiobutton(mode_frame, text="D Krishna-Standart", variable=self.mode_var, value="D", 
                       bg="#242b38", fg="#ff8585", selectcolor="#242b38").place(x=412, y=5)

        # ---- COMMON INPUTS y=540 h=120 ----
        in_frame = tk.LabelFrame(self.root, text=" COMMON INPUTS ", bg="#242b38", fg="#99ccff", font=('Arial', 9, 'bold'))
        in_frame.place(x=LX, y=FH - 540 - 120, width=LW, height=120)

        self.fields = {}
        
        # Left Column Map
        left_rows = [("T_liq [C]", 25, "deg C"), ("T_air [C]", 25, "deg C"), ("H2O2 wt%", 30, "wt %")]
        for i, (lbl, val, unit) in enumerate(left_rows):
            y_pos = 10 + i * 30
            tk.Label(in_frame, text=lbl, bg="#242b38", fg="#c7dbe6").place(x=4, y=y_pos)
            entry = tk.Entry(in_frame, width=12, bg="#edf4ff")
            entry.insert(0, str(val))
            entry.place(x=124, y=y_pos)
            self.fields[lbl] = entry
            tk.Label(in_frame, text=unit, bg="#242b38", fg="#759ecc").place(x=218, y=y_pos)

        # Right Column Map
        right_rows = [("P_ref [Pa]", 101325, "Pa"), ("RH_init [%]", 50, "%"), ("f_N2", 0, "vol fr")]
        for i, (lbl, val, unit) in enumerate(right_rows):
            y_pos = 10 + i * 30
            tk.Label(in_frame, text=lbl, bg="#242b38", fg="#c7dbe6").place(x=278, y=y_pos)
            entry = tk.Entry(in_frame, width=12, bg="#edf4ff")
            entry.insert(0, str(val))
            entry.place(x=398, y=y_pos)
            self.fields[lbl] = entry
            tk.Label(in_frame, text=unit, bg="#242b38", fg="#759ecc").place(x=492, y=y_pos)

        # ---- N2 INJECTION METHOD y=510 h=26 ----
        n2_frame = tk.LabelFrame(self.root, text=" N2 INJECTION METHOD ", bg="#212633", fg="#8cb8ea", font=('Arial', 8, 'bold'))
        n2_frame.place(x=LX, y=FH - 510 - 45, width=LW, height=45)
        
        self.n2_var = tk.StringVar(value="I")
        tk.Radiobutton(n2_frame, text="I Isobaric replacement (P fixed, H2O partial press. reduced)", 
                       variable=self.n2_var, value="I", bg="#212633", fg="#b3e0b3", selectcolor="#212633").place(x=2, y=0)
        tk.Radiobutton(n2_frame, text="II Pressurisation (P rises)", 
                       variable=self.n2_var, value="II", bg="#212633", fg="#ffc766", selectcolor="#212633").place(x=360, y=0)

        # ---- BOUNDARY LAYER PANEL y=358 h=148 ----
        bl_frame = tk.LabelFrame(self.root, text=" BOUNDARY LAYER (auto-calculated for Modes B/C/D) ", bg="#1e2433", fg="#9ecfff", font=('Arial', 9, 'bold'))
        bl_frame.place(x=LX, y=FH - 358 - 148, width=LW, height=148)

        tk.Label(bl_frame, text="Air velocity U", bg="#1e2433", fg="#c7e0fa").place(x=6, y=10)
        self.bl_u = tk.Entry(bl_frame, width=10, bg="#e6f0ff")
        self.bl_u.insert(0, "0.5")
        self.bl_u.place(x=170, y=10)
        tk.Label(bl_frame, text="m/s (0 = natural conv.)", bg="#1e2433", fg="#759ecc").place(x=274, y=10)

        # Manual Override Checkbox
        self.bl_ov_var = tk.BooleanVar(value=False)
        tk.Checkbutton(bl_frame, text="Manual override delta [mm]", variable=self.bl_ov_var, 
                       command=self.on_bl_override, bg="#1e2433", fg="#ffcc66", selectcolor="#1e2433").place(x=6, y=100)
        
        self.bl_man = tk.Entry(bl_frame, width=10, bg="#faebc3", state='disabled')
        self.bl_man.insert(0, "5.0")
        self.bl_man.place(x=210, y=100)
        tk.Label(bl_frame, text="mm (overrides auto delta_eff)", bg="#1e2433", fg="#b39e61").place(x=294, y=100)

        # ---- ACTION BUTTONS ----
        btn_frame = tk.Frame(self.root, bg="#1a1e29")
        btn_frame.place(x=LX, y=FH - 174 - 36, width=LW, height=36)
        
        tk.Button(btn_frame, text="Calculate T=0", command=self.do_calculate, bg="#334455", fg="white").pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="RUN SIMULATION", command=self.run_simulation, bg="#228B22", fg="white", font=('Arial', 9, 'bold')).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="Export CSV", command=self.export_csv, bg="#555555", fg="white").pack(side=tk.LEFT, padx=5)

    def on_bl_override(self):
        """Toggle boundary layer manual override field state."""
        if self.bl_ov_var.get():
            self.bl_man.config(state='normal')
        else:
            self.bl_man.config(state='disabled')

    def do_calculate(self):
        """
        Static calculation of evaporation rates at t=0 based on current UI inputs.
        Retrieves t=0 values from the curves and common inputs, computes 
        thermodynamic properties, and evaluates the flux kernel.
        """
        print("\n--- Running Static Calculation (t=0) ---")
        
        # 1. Read Common Inputs & Environment at t=0
        try:
            T_liq = float(self.fields["T_liq [C]"].get()) + 273.15
            T_air = float(self.fields["T_air [C]"].get()) + 273.15
            wt_H2O2 = float(self.fields["H2O2 wt%"].get()) / 100.0
            P_ref = float(self.fields["P_ref [Pa]"].get())
            RH_init = float(self.fields["RH_init [%]"].get()) / 100.0
            f_N2 = float(self.fields["f_N2"].get())
        except ValueError:
            print("Error: Invalid numeric input in Common Inputs.")
            return

        mode = self.mode_var.get()
        
        # 2. Mole Fractions in Liquid (H2O2 = 1, H2O = 2)
        if wt_H2O2 == 0:
            x1 = 0.0
        elif wt_H2O2 == 1:
            x1 = 1.0
        else:
            moles1 = wt_H2O2 / M1
            moles2 = (1.0 - wt_H2O2) / M2
            x1 = moles1 / (moles1 + moles2)
        x2 = 1.0 - x1

        # 3. Vapor Pressure (Pure components)
        # H2O2 vapor pressure (Giguere & Maass)
        p1_pure = H2O2_pref * np.exp(-H2O2_HvR * (1/T_liq - 1/H2O2_Tref))
        
        # H2O vapor pressure (Tetens approximation / Antoine)
        T_C = T_liq - 273.15
        p2_pure = 610.78 * np.exp(17.27 * T_C / (T_C + 237.3))

        # 4. Activity Coefficients (Margules model for H2O2/H2O mixtures)
        gamma1 = np.exp(x2**2 * (A12m + 2*(A21m - A12m)*x1))
        gamma2 = np.exp(x1**2 * (A21m + 2*(A12m - A21m)*x2))

        # 5. Surface Partial Pressures (Raoult's law modified by activity)
        p1_surf = x1 * gamma1 * p1_pure
        p2_surf = x2 * gamma2 * p2_pure

        # 6. Bulk Gas Partial Pressures
        T_air_C = T_air - 273.15
        p2_pure_air = 610.78 * np.exp(17.27 * T_air_C / (T_air_C + 237.3))
        p2_bulk = RH_init * p2_pure_air
        p1_bulk = 0.0  # Standard assumption: zero H2O2 in bulk air initially
        
        # 7. Flux Kernel Execution (Stage-1 Free Film Evaporation)
        flux1, flux2 = 0.0, 0.0
        
        if mode == "A":
            # Mode A: Hertz-Knudsen (Perfectly stirred, no film resistance)
            # Assuming alpha=1.0 (sticking coefficient) for default initial setup
            alpha1, alpha2 = 1.0, 1.0 
            denom1 = np.sqrt(2 * np.pi * M1 * R_gas * T_liq)
            denom2 = np.sqrt(2 * np.pi * M2 * R_gas * T_liq)
            
            flux1 = alpha1 * (p1_surf - p1_bulk) / denom1
            flux2 = alpha2 * (p2_surf - p2_bulk) / denom2

        elif mode in ["B", "C", "D"]:
            # Modes B/C/D: Boundary Layer (Stefan / Fick / Wilke)
            u_air = float(self.bl_u.get())
            if self.bl_ov_var.get():
                delta_eff = float(self.bl_man.get()) / 1000.0  # mm to meters
            else:
                # Auto-calculate BL thickness (L=0.1m, nu_air=1.5e-5 m2/s)
                L_char = 0.1 
                nu_air = 1.5e-5
                Re = u_air * L_char / nu_air
                delta_eff = (4.64 * L_char / np.sqrt(Re)) if Re > 0 else 0.005
                    
            # Approximated Diffusivities in air [m2/s]
            D1_air = 1.3e-5 
            D2_air = 2.4e-5 
            
            # Simple Mass Transfer Coefficient k_g [m/s]
            k_g1 = D1_air / delta_eff
            k_g2 = D2_air / delta_eff
            
            # Flux [mol/m2/s] = k_g / (RT) * dp
            flux1 = (k_g1 / (R_gas * T_air)) * (p1_surf - p1_bulk)
            flux2 = (k_g2 / (R_gas * T_air)) * (p2_surf - p2_bulk)
        
        # 8. Output Results
        # Convert mol/m2/s -> grams / min (for an A_surf of 100 cm2 / 0.01 m2)
        g_min_1 = flux1 * M1 * 1000 * 60 * A_surf
        g_min_2 = flux2 * M2 * 1000 * 60 * A_surf
        
        print(f"--- Thermodynamic State ---")
        print(f"Liquid Mole Fractions: x_H2O2 = {x1:.4f}, x_H2O = {x2:.4f}")
        print(f"Surface Pressures: p_H2O2 = {p1_surf:.2f} Pa, p_H2O = {p2_surf:.2f} Pa")
        print(f"Bulk Pressures:    p_H2O2 = {p1_bulk:.2f} Pa, p_H2O = {p2_bulk:.2f} Pa")
        print(f"--- Stage-1 Fluxes (Mode {mode}) ---")
        print(f"H2O2: {flux1:.4e} mol/m2/s  |  {g_min_1:.6f} g/min")
        print(f"H2O : {flux2:.4e} mol/m2/s  |  {g_min_2:.6f} g/min")

    def run_simulation(self):
        """
        DYNAMIC SIMULATOR 
        Integrates the evaporation mass loss over time using SciPy's ODE solvers.
        State vector Y = [m1_liq, m2_liq, xi_r1, xi_r2, phi_w]
        """
        print("\n--- Starting Dynamic Time-Stepping Simulator ---")
        
        # 1. Fetch Static / Initial Inputs
        try:
            wt_H2O2 = float(self.fields["H2O2 wt%"].get()) / 100.0
            P_ref = float(self.fields["P_ref [Pa]"].get())
            mode = self.mode_var.get()
        except ValueError:
            print("Error: Invalid numeric input.")
            return

        # For this simulation, assume an initial liquid film of 1mm thickness
        # over the 100 cm^2 area. Total volume = 10 cm^3 = 10 mL.
        # Density approx 1100 kg/m^3 for 30% H2O2
        rho_init = 1100.0 
        V_init = 1e-3 * A_surf  # 1mm depth * Area [m^3]
        m_total_init = rho_init * V_init
        
        m1_init = m_total_init * wt_H2O2
        m2_init = m_total_init * (1.0 - wt_H2O2)
        
        # Initial state vector: [mass_H2O2, mass_H2O, retained_H2O2, retained_H2O, plasticisation]
        Y0 = [m1_init, m2_init, 0.0, 0.0, 0.0]
        
        # Time span (from the curve data, usually 0 to 3600 seconds)
        t_span = (0, 3600)
        t_eval = np.linspace(0, 3600, 300) # output resolution

        # 2. Define the ODE Function
        def evap_ode(t, Y):
            m1, m2, xi1, xi2, phi_w = Y
            
            # Prevent negative masses from causing math errors
            m1 = max(0, m1)
            m2 = max(0, m2)
            
            # If liquid is gone, rates are zero (ignoring substrate for this phase)
            if m1 + m2 <= 1e-9:
                return [0.0, 0.0, 0.0, 0.0, 0.0]

            # --- Interpolate Time-Dependent Curves ---
            # In a full app, you would interpolate self.crv_data.
            # Here, we pull constants from the GUI fields as a baseline.
            T_liq = float(self.fields["T_liq [C]"].get()) + 273.15
            T_air = float(self.fields["T_air [C]"].get()) + 273.15
            RH_init = float(self.fields["RH_init [%]"].get()) / 100.0

            # --- Thermodynamics ---
            moles1 = m1 / M1
            moles2 = m2 / M2
            x1 = moles1 / (moles1 + moles2)
            x2 = 1.0 - x1

            p1_pure = H2O2_pref * np.exp(-H2O2_HvR * (1/T_liq - 1/H2O2_Tref))
            T_C = T_liq - 273.15
            p2_pure = 610.78 * np.exp(17.27 * T_C / (T_C + 237.3))

            gamma1 = np.exp(x2**2 * (A12m + 2*(A21m - A12m)*x1))
            gamma2 = np.exp(x1**2 * (A21m + 2*(A12m - A21m)*x2))

            p1_surf = x1 * gamma1 * p1_pure
            p2_surf = x2 * gamma2 * p2_pure

            T_air_C = T_air - 273.15
            p2_pure_air = 610.78 * np.exp(17.27 * T_air_C / (T_air_C + 237.3))
            p2_bulk = RH_init * p2_pure_air
            p1_bulk = 0.0 

            # --- Flux Calculation ---
            if mode == "A":
                denom1 = np.sqrt(2 * np.pi * M1 * R_gas * T_liq)
                denom2 = np.sqrt(2 * np.pi * M2 * R_gas * T_liq)
                flux1 = (p1_surf - p1_bulk) / denom1
                flux2 = (p2_surf - p2_bulk) / denom2
            else:
                u_air = float(self.bl_u.get())
                if self.bl_ov_var.get():
                    delta_eff = float(self.bl_man.get()) / 1000.0
                else:
                    Re = u_air * 0.1 / 1.5e-5
                    delta_eff = (4.64 * 0.1 / np.sqrt(Re)) if Re > 0 else 0.005
                
                k_g1 = 1.3e-5 / delta_eff
                k_g2 = 2.4e-5 / delta_eff
                flux1 = (k_g1 / (R_gas * T_air)) * (p1_surf - p1_bulk)
                flux2 = (k_g2 / (R_gas * T_air)) * (p2_surf - p2_bulk)

            # Mass derivatives (dm/dt = - Flux * MolarMass * Area)
            dm1_dt = -flux1 * M1 * A_surf
            dm2_dt = -flux2 * M2 * A_surf
            
            # Substrate dynamics (v15 placeholders for xi1, xi2, phi_w)
            dxi1_dt = 0.0
            dxi2_dt = 0.0
            dphi_w_dt = 0.0

            return [dm1_dt, dm2_dt, dxi1_dt, dxi2_dt, dphi_w_dt]

        # 3. Execute Solver
        print("Solving ODEs... (RK45)")
        # solve_ivp is the standard equivalent to MATLAB's ode45/ode23
        sol = solve_ivp(evap_ode, t_span, Y0, t_eval=t_eval, method='RK45', 
                        rtol=1e-5, atol=1e-8)

        if sol.success:
            print(f"Simulation completed successfully in {len(sol.t)} steps.")
            self.sim_data = sol # Store for CSV export later
            self._plot_results(sol)
        else:
            print("Simulation failed:", sol.message)

    def _plot_results(self, sol):
        """Helper to visualize the simulation results instantly"""
        import matplotlib.pyplot as plt
        
        t_min = sol.t / 60.0 # Convert to minutes
        m1_g = sol.y[0] * 1000 # Convert kg to grams
        m2_g = sol.y[1] * 1000
        m_tot_g = m1_g + m2_g
        
        wt_frac = np.zeros_like(m1_g)
        valid = m_tot_g > 1e-6
        wt_frac[valid] = (m1_g[valid] / m_tot_g[valid]) * 100.0

        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4))
        
        # Plot 1: Masses
        ax1.plot(t_min, m1_g, label='H2O2 Mass (g)', color='orange', linewidth=2)
        ax1.plot(t_min, m2_g, label='H2O Mass (g)', color='blue', linewidth=2)
        ax1.plot(t_min, m_tot_g, label='Total Mass (g)', color='black', linestyle='--')
        ax1.set_xlabel('Time (minutes)')
        ax1.set_ylabel('Mass (g)')
        ax1.set_title('Evaporation Mass Loss')
        ax1.grid(True, alpha=0.3)
        ax1.legend()

        # Plot 2: Concentration
        ax2.plot(t_min, wt_frac, label='H2O2 wt%', color='red', linewidth=2)
        ax2.set_xlabel('Time (minutes)')
        ax2.set_ylabel('Weight %')
        ax2.set_title('Liquid Concentration Shift')
        ax2.grid(True, alpha=0.3)
        ax2.set_ylim(0, 100)
        ax2.legend()

        plt.tight_layout()
        plt.show()

    def export_csv(self):
        """
        Exports the dynamic simulation trajectory to a CSV file.
        Requires run_simulation() to have been executed first.
        """
        print("\n--- Exporting to CSV ---")
        
        # 1. Check if simulation data exists
        if not hasattr(self, 'sim_data') or self.sim_data is None:
            err_msg = "No simulation data found. Please click 'RUN SIMULATION' first."
            print(f"Error: {err_msg}")
            messagebox.showwarning("Export Error", err_msg)
            return

        # 2. Prompt user for save location
        filepath = filedialog.asksaveasfilename(
            defaultextension=".csv",
            filetypes=[("CSV Files", "*.csv"), ("All Files", "*.*")],
            title="Save Simulation Data As..."
        )
        
        # If user cancels the dialog, filepath will be empty
        if not filepath:
            print("Export cancelled by user.")
            return

        # 3. Process the data
        try:
            sol = self.sim_data
            t_sec = sol.t
            t_min = t_sec / 60.0
            
            m1_g = sol.y[0] * 1000.0  # kg to g
            m2_g = sol.y[1] * 1000.0  # kg to g
            m_tot_g = m1_g + m2_g
            
            # Calculate weight fraction safely
            wt_frac = np.zeros_like(m1_g)
            valid_idx = m_tot_g > 1e-6
            wt_frac[valid_idx] = (m1_g[valid_idx] / m_tot_g[valid_idx]) * 100.0

            # 4. Write to CSV
            with open(filepath, mode='w', newline='') as csv_file:
                writer = csv.writer(csv_file)
                
                # Write Header
                writer.writerow([
                    "Time (s)", 
                    "Time (min)", 
                    "H2O2 Mass (g)", 
                    "H2O Mass (g)", 
                    "Total Mass (g)", 
                    "H2O2 wt%"
                ])
                
                # Write Rows
                for i in range(len(t_sec)):
                    writer.writerow([
                        f"{t_sec[i]:.2f}",
                        f"{t_min[i]:.4f}",
                        f"{m1_g[i]:.6f}",
                        f"{m2_g[i]:.6f}",
                        f"{m_tot_g[i]:.6f}",
                        f"{wt_frac[i]:.4f}"
                    ])

            print(f"Success: Simulation data exported to {filepath}")
            messagebox.showinfo("Export Successful", f"Data saved to:\n{filepath}")

        except Exception as e:
            err_msg = f"Failed to write CSV file: {str(e)}"
            print(f"Error: {err_msg}")
            messagebox.showerror("Export Error", err_msg)

if __name__ == "__main__":
    root = tk.Tk()
    app = EvapCalculatorApp(root)
    root.mainloop()